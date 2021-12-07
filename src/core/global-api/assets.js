/* @flow */
import { ASSET_TYPES } from 'shared/constants'
import { isPlainObject, validateComponentName } from '../util/index'

export function initAssetRegisters (Vue: GlobalAPI) {
  ASSET_TYPES.forEach(type => {
    Vue[type] = function (
      id: string,
      definition: Function | Object
    ): Function | Object | void {
      if (!definition) {  // 判断是获取还是注册,如果第二个参数没有传递,获取已经注册的组件,过滤器和指令
        return this.options[type + 's'][id]
      } else {
        if (process.env.NODE_ENV !== 'production' && type === 'component') {
          validateComponentName(id)
        }
        if (type === 'component' && isPlainObject(definition)) {
          // 如果传递了 name 则作为组件名, 否则使用id作为组件名
          definition.name = definition.name || id
          definition = this.options._base.extend(definition)
        }
        // 注册指令时执行 bind和update方法
        if (type === 'directive' && typeof definition === 'function') {
          definition = { bind: definition, update: definition }
        }
        // 将所有注册的指令,组件, 过滤器添加进 Vue.options[directives/components/filters]
        this.options[type + 's'][id] = definition
        return definition
      }
    }
  })
}
