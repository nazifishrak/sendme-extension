import { useState, useEffect } from "react";
import {
  Form,
  ActionPanel,
  Action,
  showToast,
  Toast,
  useNavigation,
  Icon,
  Alert,
} from "@raycast/api";
import { ShareSession } from "./types";
import { globalSessions } from "./sessionManager";
import { SessionsList } from "./components/SessionsList";
import { handleError } from "./utils/errors";
import { sendmeInTerminal } from "./utils/terminal";
import { startSendmeProcess } from "./utils/sendme";

export default function Command() {
  const [isLoading, setIsLoading] = useState(true);
  const [sessionCount, setSessionCount] = useState(0);
  const [processingFiles, setProcessingFiles] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
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

  // Process a single file and create a session for it
  const processFile = async (filePath: string): Promise<boolean> => {
    try {
      const sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const fileName = filePath.split("/").pop() || "";

      const newSession: ShareSession = {
        id: sessionId,
        process: null,
        filePath: filePath,
        fileName: fileName,
        startTime: new Date(),
        ticket: "",
      };

      globalSessions.addSession(newSession);

      const ticket = await startSendmeProcess(filePath, sessionId);
      newSession.ticket = ticket;
      await globalSessions.persistSessions();

      return true;
    } catch (error) {
      console.error(`Failed to process file: ${filePath}`, error);
      return false;
    }
  };

  const handleSubmit = async (values: { file: string[] }) => {
    try {
      setIsLoading(true);

      if (!values.file?.length) {
        throw new Error("No files selected");
      }

      const filePaths = values.file;
      setTotalFiles(filePaths.length);

      // Show initial progress toast for multiple files
      if (filePaths.length > 1) {
        await showToast({
          style: Toast.Style.Animated,
          title: `Processing ${filePaths.length} files`,
          message: "Starting file sharing...",
        });
      }

      let successCount = 0;
      let failureCount = 0;

      // Process each file sequentially
      for (let i = 0; i < filePaths.length; i++) {
        setProcessingFiles(i + 1);
        const filePath = filePaths[i];
        const success = await processFile(filePath);

        if (success) {
          successCount++;

          // For single file or last file in batch, show success
          if (filePaths.length === 1 || i === filePaths.length - 1) {
            await showToast({
              style: Toast.Style.Success,
              title:
                filePaths.length === 1
                  ? "File sharing started"
                  : `File sharing started for ${successCount} files`,
              message: "Ticket copied to clipboard",
            });
          }
        } else {
          failureCount++;

          // For single file or last file in batch, show failure
          if (filePaths.length === 1 || i === filePaths.length - 1) {
            await showToast({
              style: Toast.Style.Failure,
              title:
                filePaths.length === 1
                  ? "Error starting share"
                  : `Error starting share for ${failureCount} files`,
              message: "Try using Terminal fallback",
              primaryAction: {
                title: "Use Terminal",
                onAction: () => sendmeInTerminal(filePath),
              },
            });
          }
        }
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
          title={`Active Sessions (⌘⇧U to manage)`}
          text={`You have ${sessionCount} active sharing session(s)`}
        />
      )}
    </Form>
  );
}
