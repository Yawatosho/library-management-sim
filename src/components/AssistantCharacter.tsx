import { useEffect, useState } from "react";
import type { AssistantExpression } from "../game/types";
import { MessageBox } from "./MessageBox";

interface AssistantCharacterProps {
  expression: AssistantExpression;
  message: string;
}

const expressionLabels: Record<AssistantExpression, string> = {
  normal: "通常",
  smile: "笑顔",
  worried: "心配",
  surprised: "驚き",
  explain: "説明",
  cheer: "応援",
};

export const AssistantCharacter = ({ expression, message }: AssistantCharacterProps) => {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = `${import.meta.env.BASE_URL}assets/images/librarian_${expression}.png`;

  useEffect(() => {
    setImageFailed(false);
  }, [expression]);

  return (
    <aside className="assistant" aria-label="進行役 司書さん">
      <div className="assistant__portrait">
        {!imageFailed ? (
          <img
            src={imageUrl}
            alt={`司書さん ${expressionLabels[expression]}`}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className={`assistant__placeholder assistant__placeholder--${expression}`}>
            <span>司書さん</span>
            <small>{expressionLabels[expression]}</small>
          </div>
        )}
      </div>
      <MessageBox message={message} tone={expression === "worried" ? "warn" : "normal"} />
    </aside>
  );
};
