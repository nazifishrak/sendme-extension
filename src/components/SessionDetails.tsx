import {
  Detail,
  ActionPanel,
  Action,
  Icon,
  Clipboard,
  showToast,
  Toast,
} from "@raycast/api";
import { format } from "date-fns";
import { ShareSession } from "../types";

interface SessionDetailsProps {
  session: ShareSession;
  onClose: () => void;
}

export function SessionDetails({ session, onClose }: SessionDetailsProps) {
  const markdown = `# File Sharing Session: ${session.fileName}

Your file **${session.fileName}** is currently being shared with the following ticket:

\`\`\`
${session.ticket}
\`\`\`

## Instructions for the Recipient

Tell the recipient to run:

\`\`\`
sendme receive ${session.ticket}
\`\`\`

## Session Details

- **File Path:** ${session.filePath}
- **Started:** ${format(session.startTime, "MMM d, yyyy h:mm a")}
- **Session ID:** ${session.id}
${session.pid ? `- **Process ID:** ${session.pid}` : ""}
${session.isDetached ? `\n> ⚠️ This is a recovered session from a previous run.` : ""}
`;

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action
            title="Copy Ticket"
            icon={Icon.Clipboard}
            onAction={async () => {
              await Clipboard.copy(session.ticket);
              await showToast({
                style: Toast.Style.Success,
                title: "Ticket Copied",
              });
            }}
          />
          <Action
            title="Back to Sessions List"
            icon={Icon.ArrowLeft}
            onAction={onClose}
          />
        </ActionPanel>
      }
    />
  );
}
