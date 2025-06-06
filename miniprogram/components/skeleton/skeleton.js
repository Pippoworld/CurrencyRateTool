Component({
  properties: {
    // 骨架屏类型：rate-card, list, chart, bank-card
    type: {
      type: String,
      value: 'rate-card'
    },
    // 列表项数量（仅当type为list时有效）
    count: {
      type: Number,
      value: 3
    },
    // 是否显示骨架屏
    loading: {
      type: Boolean,
      value: true
    }
  },

  data: {
    
  },

  methods: {
    
  }
}); 