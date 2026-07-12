import type { PolicyId } from "../game/types";
import { PolicyPanel } from "./PolicyPanel";

interface PolicyModalProps {
  selectedPolicyId: PolicyId | null;
  onSelect: (policyId: PolicyId) => void;
  onClose: () => void;
}

export const PolicyModal = ({ selectedPolicyId, onSelect, onClose }: PolicyModalProps) => (
  <div className="modal-backdrop policy-backdrop" role="dialog" aria-modal="true" aria-labelledby="policy-modal-heading">
    <section className="modal policy-modal">
      <div className="modal__header">
        <div>
          <span className="result-kicker">重点方針</span>
          <h2 id="policy-modal-heading">今月の方針を選択</h2>
          <span>選んだ方針に応じてコマンド効果が補正されます</span>
        </div>
        <button type="button" className="ghost-button policy-modal__close" onClick={onClose}>
          閉じる
        </button>
      </div>

      <PolicyPanel
        selectedPolicyId={selectedPolicyId}
        onSelect={(policyId) => {
          onSelect(policyId);
          onClose();
        }}
        variant="bare"
      />
    </section>
  </div>
);
