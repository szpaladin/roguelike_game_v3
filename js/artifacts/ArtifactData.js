export const ARTIFACTS = [
    {
        id: 'deep_sea_echo',
        name: '深海回响',
        icon: '🐚',
        desc: '致命伤触发免死并短暂无敌。',
        effectDesc: '致命伤保留1点生命并进入短暂无敌',
        drawbackDesc: '氧气消耗加快10%'
    },
    {
        id: 'decompression_shell',
        name: '减压壳',
        icon: '🪸',
        desc: '减少氧气消耗，但会拖慢行动。',
        effectDesc: '氧气消耗间隔 +20%',
        drawbackDesc: '移动速度 -8%'
    },
    {
        id: 'shield_echo',
        name: '护盾回声',
        icon: '🛡️',
        desc: '周期性获得护盾抵挡一次伤害。',
        effectDesc: '每12秒获得1次护盾',
        drawbackDesc: '护盾生成瞬间短暂减速'
    },
    {
        id: 'emergency_float',
        name: '紧急浮囊',
        icon: '🛟',
        desc: '低血量触发短暂加速逃生。',
        effectDesc: '生命低于30%时短暂加速',
        drawbackDesc: '触发后5秒内攻速下降'
    },
    {
        id: 'fission_lens',
        name: '裂变透镜',
        icon: '🔬',
        desc: '命中必定引发小范围爆炸。',
        effectDesc: '命中触发小范围爆炸',
        drawbackDesc: '基础伤害 -15%'
    },
    {
        id: 'hunter_mark',
        name: '追猎标记',
        icon: '🎯',
        desc: '连续命中同一目标可叠伤。',
        effectDesc: '连续命中同一目标伤害递增',
        drawbackDesc: '对其他目标伤害降低'
    },
    {
        id: 'shock_feedback',
        name: '震荡反馈',
        icon: '⚡',
        desc: '命中时有概率震荡目标。',
        effectDesc: '命中触发震荡效果',
        drawbackDesc: '攻击间隔 +5%'
    },
    {
        id: 'reheat_device',
        name: '回火装置',
        icon: '🔥',
        desc: '击杀后短时间强化输出。',
        effectDesc: '击杀后2秒伤害提升',
        drawbackDesc: '未击杀前伤害略降'
    },
    {
        id: 'overgrowth_core',
        name: '蔓延晶核',
        icon: '🌱',
        desc: '所有命中可叠加蔓延层数。',
        effectDesc: '命中附加蔓延叠层',
        drawbackDesc: '蔓延爆发后短暂减速'
    },
    {
        id: 'corrosion_imprint',
        name: '腐蚀刻印',
        icon: '🧪',
        desc: '延长DOT持续时间。',
        effectDesc: 'DOT持续时间 +25%',
        drawbackDesc: 'DOT伤害 -10%'
    },
    {
        id: 'curse_rune',
        name: '咒纹石',
        icon: '🧿',
        desc: '强化诅咒爆发。',
        effectDesc: '诅咒触发伤害提升、消耗层数增加',
        drawbackDesc: '诅咒持续时间略降'
    },
    {
        id: 'stasis_shard',
        name: '凝滞晶片',
        icon: '🧊',
        desc: '冻结时间更长。',
        effectDesc: '冻结持续时间 +0.5秒',
        drawbackDesc: '冻结概率略降'
    },
    {
        id: 'relic_navigator',
        name: '遗迹导航器',
        icon: '🗺️',
        desc: '更容易发现宝箱。',
        effectDesc: '宝箱掉落频率小幅提升',
        drawbackDesc: '受到的伤害略增'
    },
    {
        id: 'shadow_compass',
        name: '幽光罗盘',
        icon: '🧭',
        desc: '提升能见度。',
        effectDesc: '光照略微提升',
        drawbackDesc: '撤离点出现距离变远'
    },
    {
        id: 'tide_chip',
        name: '潮汐芯片',
        icon: '🌊',
        desc: '区域变化时触发短暂增益。',
        effectDesc: '深度区间变化时短暂加速',
        drawbackDesc: '同阶段伤害短暂下降'
    },
    {
        id: 'supply_beacon',
        name: '补给信标',
        icon: '📡',
        desc: '周期性额外生成宝箱。',
        effectDesc: '每400m额外生成一次宝箱',
        drawbackDesc: '宝箱金币奖励减少'
    },
    {
        id: 'resonance_ring',
        name: '共振环',
        icon: '💍',
        desc: '扩大范围伤害覆盖。',
        effectDesc: 'AOE范围 +15%',
        drawbackDesc: 'AOE伤害 -10%'
    },
    {
        id: 'prismatic_lens',
        name: '曜光棱镜',
        icon: '🔮',
        desc: '射线命中附带致盲。',
        effectDesc: '射线命中附加致盲',
        drawbackDesc: '射线宽度略减'
    }
];

export const ARTIFACT_MAP = ARTIFACTS.reduce((acc, artifact) => {
    acc[artifact.id] = artifact;
    return acc;
}, {});
