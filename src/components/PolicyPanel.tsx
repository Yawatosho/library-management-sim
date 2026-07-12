import { policies } from "../data/policies";
import type { PolicyId } from "../game/types";

interface PolicyPanelProps {
  selectedPolicyId: PolicyId | null;
  onSelect: (policyId: PolicyId) => void;
  disabled?: boolean;
  variant?: "panel" | "bare";
}

const policyIcons: Record<PolicyId, string> = {
  student_first: "school",
  research_focus: "science",
  publicity_focus: "campaign",
  staff_care: "health_and_safety",
  reform_push: "rocket_launch",
  budget_saving: "savings",
};

export const PolicyPanel = ({ selectedPolicyId, onSelect, disabled = false, variant = "panel" }: PolicyPanelProps) => (
  <section
    className={`${variant === "panel" ? "panel " : ""}policy-panel ${
      variant === "bare" ? "policy-panel--bare" : ""
    }`}
    aria-label={variant === "bare" ? "重点方針" : undefined}
    aria-labelledby={variant === "panel" ? "policy-heading" : undefined}
  >
    {variant === "panel" && (
      <div className="panel__header">
        <h2 id="policy-heading">重点方針</h2>
        <span>毎月1つ</span>
      </div>
    )}
    <div className="policy-grid">
      {policies.map((policy) => (
        <button
          key={policy.id}
          className={`policy-card ${selectedPolicyId === policy.id ? "is-selected" : ""}`}
          type="button"
          onClick={() => onSelect(policy.id)}
          disabled={disabled}
        >
          <strong className="policy-card__title">
            <span className="material-symbols-rounded policy-card__icon" aria-hidden="true">
              {policyIcons[policy.id]}
            </span>
            <span>{policy.name}</span>
          </strong>
          {selectedPolicyId === policy.id && (
            <span className="material-symbols-rounded policy-card__check" aria-hidden="true">
              check_circle
            </span>
          )}
          <span className="hover-tooltip">
            <b>{policy.tagline}</b>
            <small>{policy.description}</small>
          </span>
        </button>
      ))}
    </div>
  </section>
);
