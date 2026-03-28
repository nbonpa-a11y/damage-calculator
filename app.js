function byId(id) {
  return document.getElementById(id);
}

const ATTRIBUTES = ["火", "水", "電気", "土", "風", "氷", "闇", "光"];
const MAX_ATTACKERS = 8;
const STATUS_LABELS = {
  火: "やけど",
  水: "水浸し",
  電気: "感電",
  土: "泥だらけ",
  風: "かぜっぴき",
  氷: "しもやけ",
  闇: "呪い",
};

function createDefaultAttacker() {
  return {
    name: "",
    damageType: "打撃",
    attackPower: "",
    attackStage: "0",
    attackMultiplier: "",
    hitCount: "1",
    criticalCount: "0",
    attributeLevel: "50",
    attributeType: "火",
    skillMultiplier: "",
    attributeRateStage: "none",
    attributeHitCount: "1",
    jankenResult: "無し、あいこ",
    weakDamagePlus: "",
    penetration: "無し",
    collapsed: false,
    detailsExpanded: false,
  };
}

function createDefaultDefender() {
  const attributes = {};
  ATTRIBUTES.forEach((attr) => {
    attributes[attr] = { resistance: "0", status: "none" };
  });

  return {
    name: "",
    defensePower: "",
    defenseStage: "0",
    weakCover: "",
    autoGuard: "無し",
    targetHp: "",
    collapsed: false,
    detailsExpanded: false,
    attributes,
  };
}

const state = {
  attackers: [createDefaultAttacker()],
  defender: createDefaultDefender(),
};

function stageOptions(start, end, selected) {
  const arr = [];
  for (let i = start; i <= end; i += 1) {
    const label = i > 0 ? `+${i}` : String(i);
    arr.push(`<option value="${i}"${String(i) === selected ? " selected" : ""}>${label}</option>`);
  }
  return arr.join("");
}

function detailsLabel(expanded) {
  return expanded ? "その他の詳細を格納▲" : "その他の詳細入力▼";
}

function attrColorClass(attr) {
  const table = {
    火: "attr-fire",
    水: "attr-water",
    電気: "attr-electric",
    土: "attr-earth",
    風: "attr-wind",
    氷: "attr-ice",
    光: "attr-light",
    闇: "attr-dark",
  };
  return table[attr] || "";
}

function attrOptionColor(attr) {
  const table = {
    火: "#ffc7c7",
    水: "#70bfff",
    電気: "#ffef9c",
    土: "#ffe8cc",
    風: "#ddf7dd",
    氷: "#dceeff",
    光: "#ffffff",
    闇: "#eddcff",
  };
  return table[attr] || "#ffffff";
}

function fillWithHyphen(baseLabel, width) {
  const safeWidth = Math.max(0, width || 0);
  const charWidth = 8;
  const baseLength = [...baseLabel].length;
  const totalChars = Math.max(baseLength + 2, Math.floor((safeWidth - 16) / charWidth));
  const hyphenTotal = Math.max(0, totalChars - baseLength);
  const left = Math.floor(hyphenTotal / 2);
  const right = hyphenTotal - left;
  return `${"-".repeat(left)}${baseLabel}${"-".repeat(right)}`;
}

function updateFillLabels() {
  document.querySelectorAll("[data-fill-label]").forEach((el) => {
    const baseLabel = el.dataset.fillLabel || "";
    el.textContent = fillWithHyphen(baseLabel, el.clientWidth);
  });
}

function syncCriticalCount(attacker) {
  const hit = Number.parseInt(attacker.hitCount, 10);
  const crit = Number.parseInt(attacker.criticalCount, 10);
  const safeHit = [1, 2, 3].includes(hit) ? hit : 1;
  const safeCrit = Number.isInteger(crit) ? Math.max(0, Math.min(crit, safeHit)) : 0;
  attacker.hitCount = String(safeHit);
  attacker.criticalCount = String(safeCrit);
}

function renderAttackers() {
  const html = state.attackers.map((attacker, index) => {
    syncCriticalCount(attacker);
    const n = index + 1;
    const isPhysical = attacker.damageType === "打撃";

    return `
      <section class="side-panel attacker-panel" data-attacker-index="${index}">
        <div class="panel-head">
          <input
            type="text"
            class="header-name-input attacker-name-input"
            value="${attacker.name}"
            placeholder="攻撃側${n}人目"
            data-index="${index}"
            data-field="name"
            aria-label="攻撃側${n}人目の名前"
          />
          <div class="panel-actions">
            <button type="button" class="mini-toggle fill-toggle" data-fill-label="${attacker.collapsed ? "展開▼" : "格納▲"}" data-action="toggle-attacker-collapsed" data-index="${index}">${attacker.collapsed ? "展開▼" : "格納▲"}</button>
            <button type="button" class="mini-delete" data-action="delete-attacker" data-index="${index}" aria-label="攻撃側${n}人目を削除またはリセット">×</button>
          </div>
        </div>

        ${attacker.collapsed ? "" : `
        <div class="damage-type-group">
          <span>攻撃手段</span>
          <div class="segmented-control">
            <label><input type="radio" name="damageType-${index}" value="打撃" data-index="${index}" data-field="damageType"${isPhysical ? " checked" : ""}/><span>打撃</span></label>
            <label><input type="radio" name="damageType-${index}" value="特技(全体属性)" data-index="${index}" data-field="damageType"${!isPhysical ? " checked" : ""}/><span>特技(全体属性)</span></label>
          </div>
        </div>

        ${isPhysical ? `
          <label>攻撃力
            <input type="number" min="1" step="1" value="${attacker.attackPower}" data-index="${index}" data-field="attackPower" />
          </label>
        ` : `
          <div class="level-radio-group">
            <span>攻撃する側のレベル</span>
            <div class="segmented-control">
              <label><input type="radio" name="attributeLevel-${index}" value="50" data-index="${index}" data-field="attributeLevel"${attacker.attributeLevel === "50" ? " checked" : ""}/><span>50レベル</span></label>
              <label><input type="radio" name="attributeLevel-${index}" value="100" data-index="${index}" data-field="attributeLevel"${attacker.attributeLevel === "100" ? " checked" : ""}/><span>100レベル</span></label>
            </div>
          </div>
          <label>特技の属性
            <select class="attr-select ${attrColorClass(attacker.attributeType)}" data-index="${index}" data-field="attributeType">
              ${ATTRIBUTES.map((attr) => `<option style="background:${attrOptionColor(attr)}"${attr === attacker.attributeType ? " selected" : ""}>${attr}</option>`).join("")}
            </select>
          </label>
        `}

        <button type="button" class="details-toggle" data-fill-label="${detailsLabel(attacker.detailsExpanded)}" data-action="toggle-attacker-details" data-index="${index}">${detailsLabel(attacker.detailsExpanded)}</button>

        ${attacker.detailsExpanded ? `
          ${isPhysical ? `
            <label>攻撃力のバフ、デバフ状態
              <select data-index="${index}" data-field="attackStage">${stageOptions(-9, 9, attacker.attackStage)}</select>
            </label>
            <label>攻撃倍率+値（未入力なら等倍）
              <input type="number" step="0.01" placeholder="デカグロのみの例 : 0.7" value="${attacker.attackMultiplier}" data-index="${index}" data-field="attackMultiplier" />
            </label>
          ` : `
            <label>特技倍率+値（未入力なら等倍）
              <input type="number" step="0.01" placeholder="親アヒルのみの例：0.5" value="${attacker.skillMultiplier}" data-index="${index}" data-field="skillMultiplier" />
            </label>
            <label>${attacker.attributeType}属性倍率
              <select class="attr-select ${attrColorClass(attacker.attributeType)}" data-index="${index}" data-field="attributeRateStage">
                <option value="none"${attacker.attributeRateStage === "none" ? " selected" : ""}>無し</option>
                ${stageOptions(1, 9, attacker.attributeRateStage)}
              </select>
            </label>
          `}

          <div class="segmented-row">
            <span>攻撃側のじゃんけん勝敗</span>
            <div class="segmented-control">
              <label><input type="radio" name="jankenResult-${index}" value="無し、あいこ" data-index="${index}" data-field="jankenResult"${attacker.jankenResult === "無し、あいこ" ? " checked" : ""}/><span>無し、あいこ</span></label>
              <label><input type="radio" name="jankenResult-${index}" value="勝ち" data-index="${index}" data-field="jankenResult"${attacker.jankenResult === "勝ち" ? " checked" : ""}/><span>勝ち</span></label>
              <label><input type="radio" name="jankenResult-${index}" value="負け" data-index="${index}" data-field="jankenResult"${attacker.jankenResult === "負け" ? " checked" : ""}/><span>負け</span></label>
            </div>
          </div>

          ${attacker.jankenResult === "勝ち" ? `
            <label>弱点ダメージ＋
              <div class="percent-input-wrap">
                <input type="number" min="0" step="1" value="${attacker.weakDamagePlus}" data-index="${index}" data-field="weakDamagePlus" />
                <span class="percent-suffix">%</span>
              </div>
            </label>
          ` : ""}

          <div class="segmented-row">
            <span>貫通</span>
            <div class="segmented-control">
              <label><input type="radio" name="penetration-${index}" value="無し" data-index="${index}" data-field="penetration"${attacker.penetration === "無し" ? " checked" : ""}/><span>無し</span></label>
              <label><input type="radio" name="penetration-${index}" value="有り" data-index="${index}" data-field="penetration"${attacker.penetration === "有り" ? " checked" : ""}/><span>有り</span></label>
            </div>
          </div>

          ${isPhysical ? `
            <div class="inline-two">
              <div class="segmented-row">
                <span>攻撃ヒット数</span>
                <div class="segmented-control vertical-control">
                  <label><input type="radio" name="hitCount-${index}" value="1" data-index="${index}" data-field="hitCount"${attacker.hitCount === "1" ? " checked" : ""}/><span>1回</span></label>
                  <label><input type="radio" name="hitCount-${index}" value="2" data-index="${index}" data-field="hitCount"${attacker.hitCount === "2" ? " checked" : ""}/><span>2回</span></label>
                  <label><input type="radio" name="hitCount-${index}" value="3" data-index="${index}" data-field="hitCount"${attacker.hitCount === "3" ? " checked" : ""}/><span>3回</span></label>
                </div>
              </div>
              <div class="segmented-row">
                <span>クリティカル発生回数</span>
                <div class="segmented-control vertical-control">
                  ${[0, 1, 2, 3]
                    .filter((x) => x <= Number.parseInt(attacker.hitCount, 10))
                    .map((x) => `<label><input type="radio" name="criticalCount-${index}" value="${x}" data-index="${index}" data-field="criticalCount"${String(x) === attacker.criticalCount ? " checked" : ""}/><span>${x}回</span></label>`)
                    .join("")}
                </div>
              </div>
            </div>
          ` : `
            <div class="segmented-row">
              <span>特技ヒット数</span>
              <div class="segmented-control vertical-control">
                <label><input type="radio" name="attributeHitCount-${index}" value="1" data-index="${index}" data-field="attributeHitCount"${attacker.attributeHitCount === "1" ? " checked" : ""}/><span>1回</span></label>
                <label><input type="radio" name="attributeHitCount-${index}" value="2" data-index="${index}" data-field="attributeHitCount"${attacker.attributeHitCount === "2" ? " checked" : ""}/><span>2回</span></label>
                <label><input type="radio" name="attributeHitCount-${index}" value="3" data-index="${index}" data-field="attributeHitCount"${attacker.attributeHitCount === "3" ? " checked" : ""}/><span>3回</span></label>
              </div>
            </div>
          `}
        ` : ""}
        `}
      </section>
    `;
  }).join("");

  byId("attackersColumn").innerHTML = `
    ${html}
    ${state.attackers.length < MAX_ATTACKERS ? '<button type="button" id="addAttackerButton" class="add-attacker">攻撃キャラクターを追加＋</button>' : ""}
  `;

  updateFillLabels();
}

function getUsedModes() {
  return {
    hasPhysical: state.attackers.some((x) => x.damageType === "打撃"),
    usedAttributes: [...new Set(state.attackers.filter((x) => x.damageType === "特技(全体属性)").map((x) => x.attributeType))],
  };
}

function renderDefender() {
  const { hasPhysical, usedAttributes } = getUsedModes();
  const hasAttribute = usedAttributes.length > 0;
  const hasJankenWin = state.attackers.some((x) => x.jankenResult === "勝ち");
  const statusAttributes = usedAttributes.filter((attr) => attr !== "光");
  const d = state.defender;

  byId("defenderColumn").innerHTML = `
    <section class="side-panel defender-panel">
      <div class="panel-head">
        <input
          type="text"
          class="header-name-input defender-name-input"
          value="${d.name}"
          placeholder="攻撃される側"
          data-defender-field="name"
          aria-label="攻撃される側の名前"
        />
        <div class="panel-actions">
          <button type="button" class="mini-toggle fill-toggle" data-fill-label="${d.collapsed ? "展開▼" : "格納▲"}" data-action="toggle-defender-collapsed">${d.collapsed ? "展開▼" : "格納▲"}</button>
          <button type="button" class="mini-delete" data-action="reset-defender" aria-label="攻撃される側をリセット">×</button>
        </div>
      </div>

      ${d.collapsed ? "" : `
      ${hasPhysical ? `
        <label>防御力
          <input type="number" min="1" step="1" value="${d.defensePower}" data-defender-field="defensePower" />
        </label>
      ` : ""}

      ${hasAttribute ? `
        <div class="attribute-grid">
          ${usedAttributes.map((attr) => `
            <label>${attr}耐性
              <select class="attr-select ${attrColorClass(attr)}" data-defender-attr="${attr}" data-defender-kind="resistance">
                ${stageOptions(-4, 9, d.attributes[attr].resistance)}
              </select>
            </label>
          `).join("")}
        </div>
      ` : ""}

      <button type="button" class="details-toggle" data-fill-label="${detailsLabel(d.detailsExpanded)}" data-action="toggle-defender-details">${detailsLabel(d.detailsExpanded)}</button>

      ${d.detailsExpanded ? `
        ${hasPhysical ? `
          <label>防御力のバフ、デバフ状態
            <select data-defender-field="defenseStage">${stageOptions(-9, 9, d.defenseStage)}</select>
          </label>
        ` : ""}

        ${statusAttributes.length > 0 ? `
          <div class="attribute-grid">
            ${statusAttributes.map((attr) => `
              <label>${STATUS_LABELS[attr] || `${attr}属性状態異常`}
                <select class="attr-select ${attrColorClass(attr)}" data-defender-attr="${attr}" data-defender-kind="status">
                  <option value="none"${d.attributes[attr].status === "none" ? " selected" : ""}>無し</option>
                  ${stageOptions(1, 9, d.attributes[attr].status)}
                </select>
              </label>
            `).join("")}
          </div>
        ` : ""}

        ${hasJankenWin ? `
          <label>弱点カバー
            <div class="percent-input-wrap">
              <input type="number" min="0" step="1" value="${d.weakCover}" data-defender-field="weakCover" />
              <span class="percent-suffix">%</span>
            </div>
          </label>
        ` : ""}

        <div class="segmented-row">
          <span>オート防御、守り</span>
          <div class="segmented-control">
            <label><input type="radio" name="autoGuard" value="無し" data-defender-field="autoGuard"${d.autoGuard === "無し" ? " checked" : ""}/><span>無し</span></label>
            <label><input type="radio" name="autoGuard" value="有り" data-defender-field="autoGuard"${d.autoGuard === "有り" ? " checked" : ""}/><span>有り</span></label>
          </div>
        </div>

        <label>HP(入力すると残りHPも下に出ます)
          <input type="number" min="1" step="1" value="${d.targetHp}" data-defender-field="targetHp" />
        </label>
      ` : ""}
      `}
    </section>
  `;

  updateFillLabels();
}

function renderAll() {
  renderAttackers();
  renderDefender();
}

function renderResult(result) {
  const output = byId("output");

  if (result.error) {
    output.innerHTML = `<p class="error">${result.error}</p>`;
    return;
  }

  const hpBlock = result.remainingHp
    ? `
      <h4>残りHP</h4>
      <ul>
        <li class="highlight-row">平均残りHP: <span class="highlight-value">${result.remainingHp.avg.toFixed(2)}</span></li>
        <li>残りHP乱数範囲: 下限${result.remainingHp.min} ～ 上限${result.remainingHp.max}</li>
      </ul>
    `
    : "";

  output.innerHTML = `
    <section>
      <h3>ダメージ計算結果</h3>
      <ul>
        <li class="highlight-row">平均: <span class="highlight-value">${result.total.avg.toFixed(2)}ダメージ</span></li>
        <li>ダメージ乱数範囲: 下限${result.total.min} ～ 上限${result.total.max}</li>
      </ul>
      ${hpBlock}
    </section>
  `;
}

function recalculate() {
  const d = state.defender;
  let totalAvg = 0;
  let totalMin = 0;
  let totalMax = 0;

  for (let i = 0; i < state.attackers.length; i += 1) {
    const a = state.attackers[i];
    const common = {
      jankenResult: a.jankenResult,
      weakDamagePlus: a.weakDamagePlus.trim(),
      weakCover: d.weakCover.trim(),
      autoGuard: d.autoGuard,
      penetration: a.penetration,
      targetHp: "",
    };

    const result = a.damageType === "打撃"
      ? DamageCalculator.calculatePhysical({
        attackPower: a.attackPower.trim(),
        attackStage: a.attackStage,
        attackMultiplier: a.attackMultiplier.trim(),
        hitCount: a.hitCount,
        criticalCount: a.criticalCount,
        defensePower: d.defensePower.trim(),
        defenseStage: d.defenseStage,
        ...common,
      })
      : DamageCalculator.calculateAttributeSpecial({
        attributeLevel: a.attributeLevel,
        attributeType: a.attributeType,
        skillMultiplier: a.skillMultiplier.trim(),
        attributeRateStage: a.attributeRateStage,
        attributeResistanceStage: d.attributes[a.attributeType].resistance,
        attributeStatusStage: d.attributes[a.attributeType].status,
        attributeHitCount: a.attributeHitCount,
        ...common,
      });

    if (result.error) {
      renderResult({ error: `打撃を選択している場合は${result.error}` });
      return;
    }

    totalAvg += result.total.avg;
    totalMin += result.total.min;
    totalMax += result.total.max;
  }

  const finalResult = {
    total: {
      avg: totalAvg,
      min: totalMin,
      max: totalMax,
    },
  };

  if (d.targetHp.trim() !== "") {
    const hp = Number.parseInt(d.targetHp, 10);
    if (!Number.isInteger(hp) || hp <= 0) {
      renderResult({ error: "HPは正の整数で入力してください" });
      return;
    }

    finalResult.remainingHp = {
      avg: Math.max(0, hp - finalResult.total.avg),
      max: Math.max(0, hp - finalResult.total.min),
      min: Math.max(0, hp - finalResult.total.max),
    };
  }

  renderResult(finalResult);
}

function updateAttackerField(index, field, value) {
  const attacker = state.attackers[index];
  attacker[field] = value;
  if (field === "hitCount") {
    syncCriticalCount(attacker);
  }
}

function handleClick(event) {
  const addButton = event.target.closest("#addAttackerButton");
  if (addButton) {
    if (state.attackers.length < MAX_ATTACKERS) {
      state.attackers.push(createDefaultAttacker());
      renderAll();
      recalculate();
    }
    return;
  }

  const deleteButton = event.target.closest('[data-action="delete-attacker"]');
  if (deleteButton) {
    const index = Number.parseInt(deleteButton.dataset.index, 10);
    if (Number.isInteger(index)) {
      if (state.attackers.length > 1) {
        state.attackers.splice(index, 1);
      } else {
        state.attackers[0] = createDefaultAttacker();
      }
      renderAll();
      recalculate();
    }
    return;
  }

  const attackerToggle = event.target.closest('[data-action="toggle-attacker-details"]');
  if (attackerToggle) {
    const index = Number.parseInt(attackerToggle.dataset.index, 10);
    if (Number.isInteger(index)) {
      state.attackers[index].detailsExpanded = !state.attackers[index].detailsExpanded;
      renderAll();
      recalculate();
    }
    return;
  }

  const attackerCollapsedToggle = event.target.closest('[data-action="toggle-attacker-collapsed"]');
  if (attackerCollapsedToggle) {
    const index = Number.parseInt(attackerCollapsedToggle.dataset.index, 10);
    if (Number.isInteger(index)) {
      state.attackers[index].collapsed = !state.attackers[index].collapsed;
      renderAttackers();
      recalculate();
    }
    return;
  }

  const defenderToggle = event.target.closest('[data-action="toggle-defender-details"]');
  if (defenderToggle) {
    state.defender.detailsExpanded = !state.defender.detailsExpanded;
    renderDefender();
    recalculate();
    return;
  }

  const defenderCollapsedToggle = event.target.closest('[data-action="toggle-defender-collapsed"]');
  if (defenderCollapsedToggle) {
    state.defender.collapsed = !state.defender.collapsed;
    renderDefender();
    recalculate();
    return;
  }

  const defenderReset = event.target.closest('[data-action="reset-defender"]');
  if (defenderReset) {
    state.defender = createDefaultDefender();
    renderDefender();
    recalculate();
  }
}

function handleInputOrChange(event) {
  const attackerIndexText = event.target.dataset.index;
  const attackerField = event.target.dataset.field;

  if (attackerIndexText !== undefined && attackerField) {
    const index = Number.parseInt(attackerIndexText, 10);
    if (!Number.isInteger(index)) return;
    updateAttackerField(index, attackerField, event.target.value);

    if (["damageType", "attributeType", "jankenResult"].includes(attackerField)) {
      renderAll();
    } else if (["hitCount", "criticalCount", "attributeHitCount", "attributeLevel"].includes(attackerField)) {
      renderAttackers();
    }

    recalculate();
    return;
  }

  const defenderField = event.target.dataset.defenderField;
  if (defenderField) {
    state.defender[defenderField] = event.target.value;
    recalculate();
    return;
  }

  const defenderAttr = event.target.dataset.defenderAttr;
  const defenderKind = event.target.dataset.defenderKind;
  if (defenderAttr && defenderKind) {
    state.defender.attributes[defenderAttr][defenderKind] = event.target.value;
    recalculate();
  }
}

function main() {
  renderAll();
  recalculate();

  document.addEventListener("click", handleClick);
  document.addEventListener("input", handleInputOrChange);
  document.addEventListener("change", handleInputOrChange);
  window.addEventListener("resize", updateFillLabels);
}

document.addEventListener("DOMContentLoaded", main);
