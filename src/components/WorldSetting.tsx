import { createContext, useContext } from 'react'
import { defaultSetting } from '../model/setting'
export const WorldSettingContext = createContext(defaultSetting)
export const useWorldSetting = () => useContext(WorldSettingContext)
