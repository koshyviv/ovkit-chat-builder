
export enum MessageType {
  USER = "user",
  BOT = "bot",
}

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
}
