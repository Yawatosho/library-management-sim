import { useRef, useState, type ChangeEvent } from "react";
import { getYearMonth } from "../game/calculations";
import { parseGameSaveBackup, type GameSaveBackup } from "../game/storage";

interface SaveDataModalProps {
  canExport: boolean;
  onClose: () => void;
  onExport: () => Promise<void>;
  onImport: (backup: GameSaveBackup) => void;
}

export const SaveDataModal = ({ canExport, onClose, onExport, onImport }: SaveDataModalProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingBackup, setPendingBackup] = useState<GameSaveBackup | null>(null);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport();
      setError("");
      setMessage("バックアップファイルを書き出しました。");
    } catch {
      setMessage("");
      setError("バックアップファイルを書き出せませんでした。");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const backup = await parseGameSaveBackup(await file.text());
      setPendingBackup(backup);
      setFileName(file.name);
      setError("");
      setMessage("");
    } catch (reason) {
      setPendingBackup(null);
      setFileName("");
      setMessage("");
      setError(reason instanceof Error ? reason.message : "セーブファイルを読み込めませんでした。");
    }
  };

  const handleImport = () => {
    if (!pendingBackup) return;
    onImport(pendingBackup);
    setPendingBackup(null);
    setFileName("");
    setError("");
    setMessage("セーブデータを取り込みました。「続きから」で再開できます。");
  };

  const pendingDate = pendingBackup ? getYearMonth(pendingBackup.gameState.turn) : null;
  const memoryCount = pendingBackup
    ? pendingBackup.memoryCollection.randomEventIds.length + pendingBackup.memoryCollection.endingRanks.length
    : 0;

  return (
    <div className="modal-backdrop save-data-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal save-data-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-data-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="save-data-modal__header">
          <div>
            <span>LIBRARY RECORDS</span>
            <h2 id="save-data-title">セーブデータ管理</h2>
          </div>
          <button type="button" className="save-data-modal__close" onClick={onClose} aria-label="閉じる" title="閉じる">
            <span className="material-symbols-rounded" aria-hidden="true">close</span>
          </button>
        </header>

        <p className="save-data-modal__lead">
          3年間の運営記録と、思い出アルバムの解放状況をまとめて保管できます。
        </p>

        <div className="save-data-actions">
          <section className="save-data-action">
            <span className="material-symbols-rounded" aria-hidden="true">download</span>
            <div>
              <h3>記録を書き出す</h3>
              <p>現在の運営記録を専用のバックアップファイルとして保存します。</p>
            </div>
            <button type="button" onClick={handleExport} disabled={!canExport || isExporting}>
              <span className="material-symbols-rounded" aria-hidden="true">save_alt</span>
              {isExporting ? "記録を整理中..." : "バックアップを作成"}
            </button>
            {!canExport && <small>まずは新しい運営を始めてください。</small>}
          </section>

          <section className="save-data-action">
            <span className="material-symbols-rounded" aria-hidden="true">upload_file</span>
            <div>
              <h3>記録を取り込む</h3>
              <p>以前に書き出したバックアップから運営を引き継ぎます。</p>
            </div>
            <button type="button" onClick={() => inputRef.current?.click()}>
              <span className="material-symbols-rounded" aria-hidden="true">folder_open</span>
              ファイルを選ぶ
            </button>
            <input
              ref={inputRef}
              className="save-data-file-input"
              type="file"
              accept=".ulmsave,.json,application/json,application/octet-stream"
              onChange={handleFile}
            />
          </section>
        </div>

        {pendingBackup && pendingDate && (
          <section className="save-data-preview" aria-label="取り込み内容">
            <span className="material-symbols-rounded" aria-hidden="true">description</span>
            <div>
              <strong>{fileName}</strong>
              <small>{pendingDate.year}年目{pendingDate.month}月 ・ 思い出 {memoryCount}件</small>
            </div>
            <button type="button" onClick={handleImport}>この記録を取り込む</button>
            <p>現在の運営記録と思い出は、このファイルの内容に置き換わります。</p>
          </section>
        )}

        {(message || error) && (
          <p className={`save-data-feedback${error ? " is-error" : ""}`} role={error ? "alert" : "status"}>
            <span className="material-symbols-rounded" aria-hidden="true">{error ? "error" : "check_circle"}</span>
            {error || message}
          </p>
        )}
      </section>
    </div>
  );
};
