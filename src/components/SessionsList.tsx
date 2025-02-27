import { useState, useEffect, useRef } from "react";
import {
  List,
  Icon,
  Color,
  ActionPanel,
  Action,
  useNavigation,
} from "@raycast/api";
import { format } from "date-fns";
import { ShareSession } from "../types";
import { globalSessions } from "../sessionManager";

export function SessionsList() {
  const { pop } = useNavigation();
  const [sessions, setSessions] = useState<ShareSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const sessionsRef = useRef<ShareSession[]>([]);

  useEffect(() => {
    const currentSessions = globalSessions.getSessions();
    setSessions(currentSessions);
    sessionsRef.current = currentSessions;
    setIsLoading(false);

    const unsubscribe = globalSessions.subscribe(() => {
      const updatedSessions = globalSessions.getSessions();
      setSessions(updatedSessions);
      sessionsRef.current = updatedSessions;
    });

    return unsubscribe;
  }, []);

  if (!isLoading && sessions.length === 0) {
    return (
      <List>
        <List.EmptyView
          title="No Active Sharing Sessions"
          description="Create a new file sharing session from the main screen"
          icon={Icon.Upload}
          actions={
            <ActionPanel>
              <Action title="Go Back" icon={Icon.ArrowLeft} onAction={pop} />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  return (
    <List isLoading={isLoading}>
      {sessions.map((session) => (
        <List.Item
          key={session.id}
          title={session.fileName}
          subtitle={format(session.startTime, "MMM d, yyyy h:mm a")}
          accessories={[
            {
              text: session.isDetached ? "Recovered" : "Active",
              icon: Icon.CircleFilled,
              tooltip: session.isDetached
                ? "Recovered session from previous run"
                : "Sharing active",
            },
          ]}
          actions={
            <ActionPanel>
              <Action title="Go Back" icon={Icon.ArrowLeft} onAction={pop} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
