/* @flow */
import config from '../config'
import { initUse } from './use'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import { set, del } from '../observer/index'
import { ASSET_TYPES } from 'shared/constants'
import builtInComponents from '../components/index'
import { observe } from 'core/observer/index'

import {
  warn,
  extend,
  nextTick,
  mergeOptions,
  defineReactive
} from '../util/index'

export function initGlobalAPI (Vue: GlobalAPI) {
  // 防止改写config对象。
  const configDef = {}
  configDef.get = () => config
  if (process.env.NODE_ENV !== 'production') {
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }

[Vue.config]('https://cn.vuejs.org/v2/api/#%E5%85%A8%E5%B1%80%E9%85%8D%E7%BD%AE')

Object.defineProperty(Vue, 'config', configDef)

  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }

  Vue.set = set // 给一个响应式对象动态添加 属性使之成为响应式属性
  Vue.delete = del
  Vue.nextTick = nextTick

  // 将一个对象变为响应式对象
  Vue.observable = <T>(obj: T): T => {
    observe(obj)
    return obj
  }
//  在Vue身上挂载一个options对象,此处用来装载全局的 components/filters/directives
/*
Vue.filters:    包含Vue实例可用过滤器的哈希表
Vue.directives: 包含Vue实例可用指令的哈希表
Vue.components: 包含Vue实例可用组件的哈希表
初始都为一个空对象, 在下方initAssetRegisters方法中会添加进 对应的对象。
*/
  Vue.options = Object.create(null)
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

   /*
    记录当前的Vue构造函数,在后续注册组件时传递为一个对象参数时 可用
   */
  Vue.options._base = Vue

  /*
  function extend (to: Object, _from: ?Object): Object {
  for (const key in _from) {
    to[key] = _from[key]
  }
    return to
  }
  */
  //将内置组件 拷贝到 Vue.options.components 对象上,(keep-alive)
  extend(Vue.options.components, builtInComponents)

  initUse(Vue)
  initMixin(Vue)
  initExtend(Vue)
  // 注册Vue.filter() Vue.component(), Vue.directive()方法,可注册或获取
  initAssetRegisters(Vue)
}
