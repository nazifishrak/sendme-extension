import { useState, useEffect } from "react";
import { Form, ActionPanel, Action, showToast, Toast } from "@raycast/api";
import { ShareSession } from "./types";
import { globalSessions } from "./sessionManager";

export default function Command() {
  const [isLoading, setIsLoading] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    const unsubscribe = globalSessions.subscribe(() => {
      setSessionCount(globalSessions.getSessions().length);
    });
    return unsubscribe;
  }, []);

  const handleSubmit = async (values: { file: string[] }) => {
    try {
      setIsLoading(true);

      if (!values.file?.[0]) {
        throw new Error("No file selected");
      }

      const newSession: ShareSession = {
        id: Date.now().toString(),
        process: null,
        filePath: values.file[0],
        fileName: values.file[0].split("/").pop() || "",
        startTime: new Date(),
        ticket: "",
      };

      globalSessions.addSession(newSession);

      await showToast({
        style: Toast.Style.Success,
        title: "File selected",
        message: `Selected ${values.file[0]}`,
      });
    } catch (error: any) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Share File" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.FilePicker
        id="file"
        title="Select File or Folder"
        canChooseDirectories
        info="Select a file or folder to share with sendme"
      />
      {sessionCount > 0 && (
        <Form.Description
          title="Active Sessions"
          text={`You have ${sessionCount} active sharing session(s)`}
        />
      )}
    </Form>
  );
}
