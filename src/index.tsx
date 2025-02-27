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
import { shareMultipleFiles, showShareResults } from "./utils/fileShareUtils";

export default function Command() {
  const [isLoading, setIsLoading] = useState(true);
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

      if (!values.file?.length) {
        throw new Error("No files selected");
      }

      const filePaths = values.file;

      // Show initial progress toast for multiple files
      if (filePaths.length > 1) {
        await showToast({
          style: Toast.Style.Animated,
          title: `Processing ${filePaths.length} files`,
          message: "Starting file sharing...",
        });
      }

      // Use our new utility to share multiple files
      const result = await shareMultipleFiles(filePaths);

      // Show results toast
      await showShareResults(result);
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
        allowMultipleSelection={true}
        info="Select files or folders to share with sendme"
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
