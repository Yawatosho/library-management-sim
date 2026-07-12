import { useState } from "react";
import { commands } from "../data/commands";
import { formatEffect } from "../game/calculations";
import type { CommandId, PolicyId, StatKey } from "../game/types";

interface CommandPanelProps {
  selectedCommandIds: CommandId[];
  apRemaining: number;
  selectedPolicyId: PolicyId | null;
  onToggle: (commandId: CommandId) => void;
  onExecute: () => void;
  onClear: () => void;
  onPreviewChange?: (commandId: CommandId | null) => void;
  disabled?: boolean;
}

const formatBudgetCost = (cost: number) => {
  if (cost === 0) return "予算±0";
  return cost > 0 ? `予算-${cost}` : `予算+${Math.abs(cost)}`;
};

const budgetCostClass = (cost: number) => {
  if (cost < 0) return "cost-chip cost-chip--gain";
  if (cost > 0) return "cost-chip cost-chip--spend";
  return "cost-chip";
};

interface CommandCategory {
  id: string;
  name: string;
  icon: string;
  commandIds: CommandId[];
}

const commandCategories: CommandCategory[] = [
  {
    id: "collection",
    name: "資料・契約",
    icon: "local_library",
    commandIds: ["buy_books", "trial_database", "review_journals"],
  },
  {
    id: "student",
    name: "学生支援",
    icon: "school",
    commandIds: ["guidance", "long_loan", "student_survey"],
  },
  {
    id: "research",
    name: "研究・教員",
    icon: "science",
    commandIds: ["reference_boost", "faculty_visit", "oa_workshop", "repository"],
  },
  {
    id: "publicity",
    name: "広報・展示",
    icon: "campaign",
    commandIds: ["sns", "seasonal_exhibit", "poster"],
  },
  {
    id: "facility",
    name: "施設改善",
    icon: "apartment",
    commandIds: ["seats", "signage", "air_conditioning"],
  },
  {
    id: "staff",
    name: "職員ケア",
    icon: "volunteer_activism",
    commandIds: ["staff_training", "workflow_review", "rest"],
  },
  {
    id: "dx",
    name: "DX改革",
    icon: "memory",
    commandIds: ["opac", "automation"],
  },
];

const defaultCommandCategory = commandCategories[0]!;
const commandById = Object.fromEntries(commands.map((command) => [command.id, command])) as Record<CommandId, (typeof commands)[number]>;

export const CommandPanel = ({
  selectedCommandIds,
  apRemaining,
  selectedPolicyId,
  onToggle,
  onExecute,
  onClear,
  onPreviewChange,
  disabled = false,
}: CommandPanelProps) => {
  const [activeCategoryId, setActiveCategoryId] = useState(defaultCommandCategory.id);
  const selectedCount = selectedCommandIds.length;
  const activeCategory = commandCategories.find((category) => category.id === activeCategoryId) ?? defaultCommandCategory;
  const selectedCommands = selectedCommandIds.map((commandId) => commandById[commandId]);

  return (
    <section className="panel command-panel" aria-labelledby="command-heading">
      <div className="panel__header panel__header--sticky command-panel__header">
        <div>
          <h2 id="command-heading">コマンド</h2>
          <span>{selectedCount > 0 ? `${selectedCount}件選択中` : "今月の行動"}</span>
        </div>
        <div className="ap-meter" aria-label={`残りAP ${apRemaining} / 3`}>
          {[0, 1, 2].map((index) => (
            <span key={index} className={index < apRemaining ? "is-active" : ""} />
          ))}
        </div>
        <div className="command-actions">
          <button type="button" className="ghost-button" onClick={onClear} disabled={disabled || selectedCount === 0}>
            選択解除
          </button>
          <button
            type="button"
            className="primary-button command-execute-button"
            onClick={onExecute}
            disabled={disabled || !selectedPolicyId}
          >
            <span className="material-symbols-rounded" aria-hidden="true">
              {selectedCount > 0 ? "play_arrow" : "event_available"}
            </span>
            {selectedCount > 0 ? "実行" : "月を進める"}
          </button>
        </div>
      </div>

      {!selectedPolicyId && <p className="inline-warning">先に重点方針を選んでください。</p>}

      <div className="command-panel__body">
        <div className="command-category-grid" aria-label="コマンドカテゴリ">
          {commandCategories.map((category) => {
            const categorySelectedCount = category.commandIds.filter((commandId) =>
              selectedCommandIds.includes(commandId),
            ).length;

            return (
              <button
                key={category.id}
                type="button"
                className={`command-category ${category.id === activeCategory.id ? "is-active" : ""} ${
                  categorySelectedCount > 0 ? "has-selected" : ""
                }`}
                onClick={() => setActiveCategoryId(category.id)}
                aria-pressed={category.id === activeCategory.id}
              >
                <span className="material-symbols-rounded command-category__icon" aria-hidden="true">
                  {category.icon}
                </span>
                <strong>{category.name}</strong>
                {categorySelectedCount > 0 && <span className="command-category__badge">{categorySelectedCount}</span>}
              </button>
            );
          })}
        </div>

        {selectedCommands.length > 0 && (
          <div className="selected-command-strip" aria-label="選択中のコマンド">
            {selectedCommands.map((command) => (
              <button
                key={command.id}
                type="button"
                className="selected-command-chip"
                onClick={() => onToggle(command.id)}
                disabled={disabled}
              >
                <span>{command.shortName}</span>
                <small>AP{command.apCost}</small>
              </button>
            ))}
          </div>
        )}

        <div className="command-group-heading">
          <span className="material-symbols-rounded" aria-hidden="true">
            {activeCategory.icon}
          </span>
          <strong>{activeCategory.name}</strong>
          <small>{activeCategory.commandIds.length}件</small>
        </div>

        <div className="command-grid">
          {activeCategory.commandIds.map((commandId) => {
            const command = commandById[commandId];
            const selected = selectedCommandIds.includes(command.id);
            const cannotSelect = !selected && command.apCost > apRemaining;
            const effectEntries = Object.entries(command.effects) as [StatKey, number][];

            return (
              <button
                key={command.id}
                type="button"
                className={`command-card ${selected ? "is-selected" : ""} ${cannotSelect ? "is-ap-locked" : ""}`}
                onClick={() => {
                  if (!cannotSelect) {
                    onToggle(command.id);
                  }
                }}
                onFocus={() => onPreviewChange?.(command.id)}
                onBlur={() => onPreviewChange?.(null)}
                onMouseEnter={() => onPreviewChange?.(command.id)}
                onMouseLeave={() => onPreviewChange?.(null)}
                disabled={disabled}
                aria-disabled={cannotSelect}
              >
                <span className="command-card__cost">
                  <span className="cost-chip cost-chip--ap">AP{command.apCost}</span>
                  <span className={budgetCostClass(command.budgetCost)}>{formatBudgetCost(command.budgetCost)}</span>
                </span>
                <strong>{command.shortName}</strong>
                {selected && <span className="command-card__selected">選択中</span>}
                {cannotSelect && <span className="command-card__locked">AP不足</span>}
                <span className="hover-tooltip effect-list">
                  {effectEntries.map(([key, value]) => (
                    <span key={key}>{formatEffect(key, value)}</span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
