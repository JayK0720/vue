import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  // 在initMixin() 会在Vue.prototype上注册这个方法。
  this._init(options)
}
// 注册Vue._init方法, 初始化vm
initMixin(Vue)
// 注册vm的$data/$props/$set/$delete/$watch
stateMixin(Vue)
// 注册$on/$once/$emit/$off
eventsMixin(Vue)
// 注册生命周期函数_update/$forceUpdate/$destroy
lifecycleMixin(Vue)
// 渲染相关的方法以及$nextTick / _render方法
renderMixin(Vue)

export default Vue
