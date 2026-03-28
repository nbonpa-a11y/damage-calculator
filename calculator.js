(function (global) {
  function floor(n) {
    return Math.floor(n + 1e-10);
  }

  function applyStage(stat, stage) {
    const adjusted = stat * (1 + stage * 0.1);
    return floor(adjusted);
  }

  function uniformDistribution(low, high, applyModifiers = true) {
    const count = high - low + 1;
    const p = 1 / count;
    const arr = [];
    for (let v = low; v <= high; v += 1) {
      arr.push({ damage: v, p, applyModifiers });
    }
    return arr;
  }

  function normalDefaultDistribution(a, b) {
    const c = floor((a - floor(b / 2)) / 2);

    if (c >= 2) {
      const span = floor(c / 16) + 1;
      return uniformDistribution(c - span, c + span, true);
    }

    if (c <= 0) {
      return [
        { damage: 0, p: 0.5, applyModifiers: false },
        { damage: 1, p: 0.5, applyModifiers: false },
      ];
    }

    return [
      { damage: 0, p: 1 / 6, applyModifiers: false },
      { damage: 1, p: 1 / 3, applyModifiers: true },
      { damage: 1, p: 1 / 6, applyModifiers: false },
      { damage: 2, p: 1 / 3, applyModifiers: true },
    ];
  }

  function criticalDefaultDistribution(a) {
    if (a === 0) {
      return [
        { damage: 0, p: 0.5, applyModifiers: false },
        { damage: 1, p: 0.5, applyModifiers: false },
      ];
    }

    return uniformDistribution(a, floor(a * 1.1), true);
  }

  function shouldApplyAutoGuard(autoGuard, penetration) {
    return autoGuard === "有り" && penetration !== "有り";
  }

  function parseWeakPercent(text, fieldName) {
    if (text === "" || text === undefined || text === null) return { value: 0 };
    const parsed = Number.parseInt(text, 10);
    if (!Number.isInteger(parsed) || parsed < 0) {
      return { error: `${fieldName}は0以上の整数で入力してください` };
    }
    return { value: parsed };
  }

  function jankenMultiplier(jankenResult, weakDamagePlus, weakCover) {
    if (jankenResult === "勝ち") {
      return 1.5 + weakDamagePlus * 0.01 - weakCover * 0.01;
    }
    if (jankenResult === "負け") {
      return 0.7;
    }
    return 1;
  }

  function applyPostModifiers(damage, attackMultiplier, jankenResult, autoGuardActive, weakDamagePlus, weakCover) {
    let d = floor(damage * (1 + attackMultiplier));
    d = floor(d * jankenMultiplier(jankenResult, weakDamagePlus, weakCover));

    if (autoGuardActive && d !== 1) {
      d = floor(d / 2);
    }

    return d;
  }

  function finalizeDistribution(defaultOutcomes, attackMultiplier, jankenResult, autoGuardActive, weakDamagePlus, weakCover) {
    const dist = new Map();

    defaultOutcomes.forEach((o) => {
      const finalDamage = o.applyModifiers
        ? applyPostModifiers(o.damage, attackMultiplier, jankenResult, autoGuardActive, weakDamagePlus, weakCover)
        : o.damage;
      dist.set(finalDamage, (dist.get(finalDamage) || 0) + o.p);
    });

    return Array.from(dist.entries())
      .map(([damage, p]) => ({ damage, p }))
      .sort((a, b) => a.damage - b.damage);
  }

  function summarizeDistribution(dist) {
    const min = dist[0].damage;
    const max = dist[dist.length - 1].damage;
    const avg = dist.reduce((sum, x) => sum + x.damage * x.p, 0);
    return { avg, min, max };
  }

  function attachRemainingHp(result, targetHpText) {
    if (targetHpText === "") return result;

    const hp = Number.parseInt(targetHpText, 10);
    if (!Number.isInteger(hp) || hp <= 0) {
      return { error: "HPは正の整数で入力してください" };
    }

    return {
      ...result,
      remainingHp: {
        avg: Math.max(0, hp - result.total.avg),
        max: Math.max(0, hp - result.total.min),
        min: Math.max(0, hp - result.total.max),
      },
    };
  }

  function calculatePhysical(params) {
    const attackPower = Number.parseInt(params.attackPower, 10);
    const defensePower = Number.parseInt(params.defensePower, 10);
    const attackStage = Number.parseInt(params.attackStage, 10);
    const defenseStage = Number.parseInt(params.defenseStage, 10);
    const attackMultiplier = params.attackMultiplier === "" ? 0 : Number.parseFloat(params.attackMultiplier);
    const hitCount = Number.parseInt(params.hitCount ?? "1", 10);
    const criticalCount = Number.parseInt(params.criticalCount ?? "0", 10);

    if (!Number.isInteger(attackPower) || !Number.isInteger(defensePower)) {
      return { error: "攻撃力と防御力を入力してください" };
    }
    if (attackPower <= 0 || defensePower <= 0) {
      return { error: "攻撃力と防御力を入力してください" };
    }
    if (!Number.isFinite(attackMultiplier)) {
      return { error: "攻撃倍率は数値で入力してください" };
    }
    const weakDamagePlus = parseWeakPercent(params.weakDamagePlus, "弱点ダメージ＋");
    if (weakDamagePlus.error) return { error: weakDamagePlus.error };
    const weakCover = parseWeakPercent(params.weakCover, "弱点カバー");
    if (weakCover.error) return { error: weakCover.error };

    const normalCount = hitCount - criticalCount;
    const a = applyStage(attackPower, attackStage);
    const b = applyStage(defensePower, defenseStage);
    const autoGuardActive = shouldApplyAutoGuard(params.autoGuard, params.penetration);

    const normal = finalizeDistribution(
      normalDefaultDistribution(a, b),
      attackMultiplier,
      params.jankenResult,
      autoGuardActive,
      weakDamagePlus.value,
      weakCover.value
    );

    const critical = finalizeDistribution(
      criticalDefaultDistribution(a),
      attackMultiplier,
      params.jankenResult,
      autoGuardActive,
      weakDamagePlus.value,
      weakCover.value
    );

    const normalSummary = summarizeDistribution(normal);
    const criticalSummary = summarizeDistribution(critical);
    const result = {
      total: {
        avg: normalSummary.avg * normalCount + criticalSummary.avg * criticalCount,
        min: normalSummary.min * normalCount + criticalSummary.min * criticalCount,
        max: normalSummary.max * normalCount + criticalSummary.max * criticalCount,
      },
    };

    return attachRemainingHp(result, params.targetHp ?? "");
  }

  function attributeRateMultiplier(stage) {
    if (stage === "none") return 1;
    return 1 + Number.parseInt(stage, 10) * 0.1;
  }

  function attributeResistanceMultiplier(stage) {
    return {
      "-4": 2,
      "-3": 1.75,
      "-2": 1.5,
      "-1": 1.25,
      "0": 1,
      "1": 0.8,
      "2": 0.6,
      "3": 0.5,
      "4": 0.4,
      "5": 0.3,
      "6": 0.25,
      "7": 0.2,
      "8": 0.15,
      "9": 0.1,
    }[stage];
  }

  function attributeStatusMultiplier(stage, attributeType) {
    if (attributeType === "光") return 1;
    if (stage === "none") return 1;
    return 1.5 + Number.parseInt(stage, 10) * 0.1;
  }

  function calculateAttributeSpecial(params) {
    const level = params.attributeLevel;
    const skillMultiplier = params.skillMultiplier === "" ? 0 : Number.parseFloat(params.skillMultiplier);
    const rateStage = params.attributeRateStage;
    const resistanceStage = params.attributeResistanceStage;
    const statusStage = params.attributeStatusStage;
    const hitCount = Number.parseInt(params.attributeHitCount ?? "1", 10);
    const autoGuardActive = shouldApplyAutoGuard(params.autoGuard, params.penetration);

    if (!Number.isFinite(skillMultiplier)) {
      return { error: "特技倍率+値は数値で入力してください" };
    }
    const weakDamagePlus = parseWeakPercent(params.weakDamagePlus, "弱点ダメージ＋");
    if (weakDamagePlus.error) return { error: weakDamagePlus.error };
    const weakCover = parseWeakPercent(params.weakCover, "弱点カバー");
    if (weakCover.error) return { error: weakCover.error };

    const rateMul = attributeRateMultiplier(rateStage);
    const resistMul = attributeResistanceMultiplier(resistanceStage);
    const statusMul = attributeStatusMultiplier(statusStage, params.attributeType);
    if (!Number.isFinite(rateMul) || !Number.isFinite(resistMul) || !Number.isFinite(statusMul)) {
      return { error: "属性関連の選択値が不正です" };
    }

    const baseLow = level === "50" ? 107 : 384;
    const baseHigh = level === "50" ? 177 : 639;
    const attrMul = rateMul * resistMul * statusMul;
    const dist = [];
    const p = 1 / (baseHigh - baseLow + 1);

    for (let d = baseLow; d <= baseHigh; d += 1) {
      let x = floor(d * (1 + skillMultiplier));
      x = floor(x * attrMul);
      x = floor(x * jankenMultiplier(params.jankenResult, weakDamagePlus.value, weakCover.value));
      if (autoGuardActive && x !== 1) {
        x = floor(x / 2);
      }
      dist.push({ damage: x * hitCount, p });
    }

    const result = { total: summarizeDistribution(dist) };
    return attachRemainingHp(result, params.targetHp ?? "");
  }

  const api = {
    applyStage,
    normalDefaultDistribution,
    criticalDefaultDistribution,
    finalizeDistribution,
    calculatePhysical,
    calculateAttributeSpecial,
    attributeResistanceMultiplier,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  global.DamageCalculator = api;
})(typeof window !== "undefined" ? window : globalThis);
