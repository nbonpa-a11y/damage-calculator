function byId(id) {
  return document.getElementById(id);
}

function fillStageSelect(id) {
  const el = byId(id);
  for (let i = -9; i <= 9; i += 1) {
    const op = document.createElement("option");
    op.value = String(i);
    op.textContent = i > 0 ? `+${i}` : String(i);
    if (i === 0) op.selected = true;
    el.appendChild(op);
  }
}

function syncCriticalCountOptions() {
  const hitCount = Number.parseInt(byId("hitCount").value, 10);
  const criticalEl = byId("criticalCount");
  const previous = Number.parseInt(criticalEl.value || "0", 10);

  criticalEl.innerHTML = "";
  for (let i = 0; i <= hitCount; i += 1) {
    const op = document.createElement("option");
    op.value = String(i);
    op.textContent = `${i}回`;
    criticalEl.appendChild(op);
  }

  const safeValue = Math.min(previous, hitCount);
  criticalEl.value = String(Number.isNaN(safeValue) ? 0 : safeValue);
}

function renderResult(result) {
  const output = byId("output");

  if (result.error) {
    output.innerHTML = `<p class="error">${result.error}</p>`;
    return;
  }

  output.innerHTML = `
    <section>
      <h3>合算ダメージ</h3>
      <ul>
        <li>平均ダメージ: ${result.total.avg.toFixed(4)}</li>
        <li>下限ダメージ: ${result.total.min}</li>
        <li>上限ダメージ: ${result.total.max}</li>
      </ul>
    </section>
  `;
}

function main() {
  fillStageSelect("attackStage");
  fillStageSelect("defenseStage");
  syncCriticalCountOptions();

  byId("hitCount").addEventListener("change", syncCriticalCountOptions);

  byId("calculate").addEventListener("click", () => {
    const damageType = byId("damageType").value;
    const output = byId("output");

    if (damageType === "属性特技ダメージ") {
      output.innerHTML = '<p>属性特技ダメージは準備中です。物理ダメージを選択してください。</p>';
      return;
    }

    const result = DamageCalculator.calculatePhysical({
      attackPower: byId("attackPower").value.trim(),
      attackStage: byId("attackStage").value,
      attackMultiplier: byId("attackMultiplier").value.trim(),
      jankenResult: byId("jankenResult").value,
      hitCount: byId("hitCount").value,
      criticalCount: byId("criticalCount").value,
      defensePower: byId("defensePower").value.trim(),
      defenseStage: byId("defenseStage").value,
      autoGuard: byId("autoGuard").value,
    });

    renderResult(result);
  });
}

document.addEventListener("DOMContentLoaded", main);
