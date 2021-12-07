/* @flow */

import { toArray } from '../util/index'

export function initUse (Vue: GlobalAPI) {
  Vue.use = function (plugin: Function | Object) {
    /*
    已经加载过的插件, 没有的话 设置为一个空数组, 已经注册过的插件添加到_installedPlugins数组。
    */
    const installedPlugins = (this._installedPlugins || (this._installedPlugins = []))
    // 判断是否已经添加了该插件，注册过返回Vue构造函数
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }
    // toArray()去除第一个参数的方法,   然后将Vue 作为第一个参数传递过去。
    const args = toArray(arguments, 1)
    args.unshift(this)
    // 传入对象的话 必须要有一个 install方法
    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, args)
    } else if (typeof plugin === 'function') {
      plugin.apply(null, args)
    }
    installedPlugins.push(plugin)
    return this
  }
}
