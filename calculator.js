(function (global) {
  function floor(n) {
    return Math.floor(n);
  }

  function applyStage(stat, stage) {
    return floor(stat * (1 + stage * 0.1));
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

    // c === 1
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

  function applyPostModifiers(damage, attackMultiplier, jankenResult, autoGuardActive) {
    let d = floor(damage * (1 + attackMultiplier));

    if (jankenResult === "勝ち") {
      d = floor(d * 1.5);
    } else if (jankenResult === "負け") {
      d = floor(d * 0.7);
    }

    if (autoGuardActive && d !== 1) {
      d = floor(d / 2);
    }

    return d;
  }

  function finalizeDistribution(defaultOutcomes, attackMultiplier, jankenResult, autoGuardActive) {
    const dist = new Map();

    defaultOutcomes.forEach((o) => {
      const finalDamage = o.applyModifiers
        ? applyPostModifiers(o.damage, attackMultiplier, jankenResult, autoGuardActive)
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

  function calculatePhysical(params) {
    const attackPower = Number.parseInt(params.attackPower, 10);
    const defensePower = Number.parseInt(params.defensePower, 10);
    const attackStage = Number.parseInt(params.attackStage, 10);
    const defenseStage = Number.parseInt(params.defenseStage, 10);
    const attackMultiplier = params.attackMultiplier === "" ? 0 : Number.parseFloat(params.attackMultiplier);

    if (!Number.isInteger(attackPower) || !Number.isInteger(defensePower)) {
      return { error: "攻撃力と防御力を入力してください" };
    }

    if (attackPower <= 0 || defensePower <= 0) {
      return { error: "攻撃力と防御力を入力してください" };
    }

    if (!Number.isFinite(attackMultiplier)) {
      return { error: "攻撃倍率は数値で入力してください" };
    }

    const a = applyStage(attackPower, attackStage);
    const b = applyStage(defensePower, defenseStage);
    const autoGuardActive = params.autoGuard === "発動する";

    const normal = finalizeDistribution(
      normalDefaultDistribution(a, b),
      attackMultiplier,
      params.jankenResult,
      autoGuardActive
    );

    const critical = finalizeDistribution(
      criticalDefaultDistribution(a),
      attackMultiplier,
      params.jankenResult,
      autoGuardActive
    );

    return {
      normal: summarizeDistribution(normal),
      critical: summarizeDistribution(critical),
    };
  }

  const api = {
    applyStage,
    normalDefaultDistribution,
    criticalDefaultDistribution,
    finalizeDistribution,
    calculatePhysical,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  global.DamageCalculator = api;
})(typeof window !== "undefined" ? window : globalThis);