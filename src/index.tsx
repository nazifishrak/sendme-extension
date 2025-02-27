import { useState } from "react";
import { Form, ActionPanel, Action, showToast, Toast } from "@raycast/api";
import { ShareSession } from "./types";

export default function Command() {
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ShareSession[]>([]);

  const handleSubmit = async (values: { file: string[] }) => {
    try {
      setIsLoading(true);
      
      if (!values.file?.[0]) {
        throw new Error("No file selected");
      }

      // Create new session
      const newSession: ShareSession = {
        id: Date.now().toString(),
        filePath: values.file[0],
        fileName: values.file[0].split("/").pop() || "",
        startTime: new Date()
      };

      setSessions([...sessions, newSession]);
      
      await showToast({
        style: Toast.Style.Success,
        title: "File selected",
        message: `Ready to share ${newSession.fileName}`
      });

    } catch (error: any) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: error.message
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
        title="Select File"
        allowMultipleSelection={false}
      />
      
      {sessions.length > 0 && (
        <Form.Description
          title="Active Sessions"
          text={`You have ${sessions.length} active sharing session(s)`}
        />
      )}
    </Form>
  );
}