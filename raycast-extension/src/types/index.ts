// This file exports interfaces and types used throughout the Raycast extension.

export interface Command {
    name: string;
    description: string;
    execute: () => void;
}

export type CommandHandler = (args: any) => void;