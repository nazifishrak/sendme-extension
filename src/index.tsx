import { useState, useEffect } from "react";
import {
  Form,
  ActionPanel,
  Action,
  showToast,
  Toast,
  useNavigation,
  Icon,
} from "@raycast/api";
import { ShareSession } from "./types";
import { globalSessions } from "./sessionManager";
import { SessionsList } from "./components/SessionsList";
import { handleError } from "./utils/errors";
import { sendmeInTerminal } from "./utils/terminal";
import { startSendmeProcess } from "./utils/sendme";

export default function Command() {
  const [isLoading, setIsLoading] = useState(true); // Start with loading state
  const [sessionCount, setSessionCount] = useState(0);
  const { push } = useNavigation();

  // Load persisted sessions when the extension starts
  useEffect(() => {
    async function loadPersistedSessions() {
      await globalSessions.loadSessions();
      setIsLoading(false);
    }
    loadPersistedSessions();
  }, []);

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

      const sessionId = Date.now().toString();
      const newSession: ShareSession = {
        id: sessionId,
        process: null,
        filePath: values.file[0],
        fileName: values.file[0].split("/").pop() || "",
        startTime: new Date(),
        ticket: "",
      };

      globalSessions.addSession(newSession);

      try {
        const ticket = await startSendmeProcess(values.file[0], sessionId);
        newSession.ticket = ticket;
        await globalSessions.persistSessions();

        await showToast({
          style: Toast.Style.Success,
          title: "File sharing started",
          message: "Ticket copied to clipboard",
        });
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Error starting share",
          message: "Try using Terminal fallback",
          primaryAction: {
            title: "Use Terminal",
            onAction: () => sendmeInTerminal(values.file[0]),
          },
        });
      }
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: handleError(error),
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
          {sessionCount > 0 && (
            <Action
              title={`Manage Sessions (${sessionCount})`}
              icon={Icon.List}
              onAction={() => push(<SessionsList />)}
              shortcut={{ modifiers: ["cmd", "shift"], key: "u" }}
            />
          )}
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
