import type { FacilityId } from '../model/types'

export const facilities: { id: FacilityId; name: string; code: string; x: number; y: number; art: string }[] = [
  { id: 'archive', name: '档案馆', code: 'ARCHIVE', x: 18, y: 23, art: '      __________\n     /_________/|\n    | [=][=][=] ||\n    | [=][=][=] ||\n    | [=][=][=] |/\n    +----------+' },
  { id: 'web', name: '瞭望台', code: 'WEB', x: 50, y: 19, art: '        .---.\n      /  .  /\n      \\  | /\n       \\ |/\n        |=|\n     ___|=|___' },
  { id: 'terminal', name: '控制台', code: 'TERMINAL', x: 82, y: 23, art: '     .----------.\n     |  >_      |\n     |  ______  |\n     |__________|\n         |__|\n      ___|__|___' },
  { id: 'workshop', name: '制造工坊', code: 'WORKSHOP', x: 18, y: 73, art: '       __  __\n    __|  ||  |__\n   /____________\\\n   |  [##]  []  |\n   |  [##]  __  |\n   |________| |_|' },
  { id: 'portal', name: '传送门', code: 'PORTAL', x: 50, y: 77, art: '       .----.\n     .\'  ..  \'.\n    /  .\'  \'.  \\\n    |  ( @@ )  |\n    \\  \'..\'  /\n     \'------\'' },
  { id: 'test', name: '试炼场', code: 'TEST LAB', x: 82, y: 73, art: '      _      _\n     | |    | |\n     | |    | |\n    /   \\  /   \\\n   | ~~~ || ~~~ |\n   |_____||_____|' },
  { id: 'hq', name: '指挥中心', code: 'HQ', x: 50, y: 48, art: '       /\\\n      /==\\\n     /____\\\n     | [] |\n   __|____|__' },
  { id: 'utility', name: '通用站', code: 'UTILITY', x: 82, y: 48, art: '    +-----+\n    | [*] |\n    +-----+' },
]
