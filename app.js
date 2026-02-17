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

function renderResult(result) {
  const output = byId("output");

  if (result.error) {
    output.innerHTML = `<p class="error">${result.error}</p>`;
    return;
  }

  output.innerHTML = `
    <section>
      <h3>通常ダメージ</h3>
      <ul>
        <li>平均ダメージ: ${result.normal.avg.toFixed(4)}</li>
        <li>下限ダメージ: ${result.normal.min}</li>
        <li>上限ダメージ: ${result.normal.max}</li>
      </ul>
    </section>
    <section>
      <h3>クリティカル</h3>
      <ul>
        <li>平均ダメージ: ${result.critical.avg.toFixed(4)}</li>
        <li>下限ダメージ: ${result.critical.min}</li>
        <li>上限ダメージ: ${result.critical.max}</li>
      </ul>
    </section>
  `;
}

function main() {
  fillStageSelect("attackStage");
  fillStageSelect("defenseStage");

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
      defensePower: byId("defensePower").value.trim(),
      defenseStage: byId("defenseStage").value,
      autoGuard: byId("autoGuard").value,
    });

    renderResult(result);
  });
}

document.addEventListener("DOMContentLoaded", main);