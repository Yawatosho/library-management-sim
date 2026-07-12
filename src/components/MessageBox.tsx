interface MessageBoxProps {
  speaker?: string;
  message: string;
  tone?: "normal" | "warn" | "good";
}

export const MessageBox = ({ speaker = "司書さん", message, tone = "normal" }: MessageBoxProps) => (
  <div className={`message-box message-box--${tone}`}>
    <div className="message-box__speaker">{speaker}</div>
    <p>{message}</p>
  </div>
);
