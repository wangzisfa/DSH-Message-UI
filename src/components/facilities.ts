import type { FacilityId } from '../model/types'

export interface Facility {
  id: FacilityId
  name: string
  code: string
  x: number
  y: number
  art: string
}

// Half-width characters keep the machinery aligned with the terminal grid.
export const facilities: Facility[] = [
  { id: 'archive', name: '档案馆', code: '01 / MEMORY BANK', x: 18, y: 24, art: String.raw`     .____________.
    /____________/|
   | .----------. ||
   | | ## :: 01 | ||
   | | ## :: 10 | ||
   | | ## :: 01 | ||
   | '----------' ||
   | [===] [===] |/
   '-------------'
     /_/     /_/` },
  { id: 'web', name: '瞭望台', code: '02 / UPLINK ARRAY', x: 50, y: 19, art: String.raw`     .  . | .  .
   .   \  |  /   .
    .---\ | /---.
     \ ::\|/:: /
      \ ::@:: /
       '==|=='
         [|]
      ___/|\___
     /___[+]___\
      '-------'` },
  { id: 'terminal', name: '控制台', code: '03 / SHELL ACCESS', x: 82, y: 24, art: String.raw`    .____________.
   /____________/|
   | .--------. |||
   | | >_     | |||
   | | 010101 | |||
   | | ______ | ||/
   | '--------' |/
   '-----++-----'
    ____/||\____
   /_[]_[]_[]_[]/` },
  { id: 'workshop', name: '制造工坊', code: '04 / PATCH FORGE', x: 18, y: 73, art: String.raw`         [===]
     .----||----.
    / ::  || :: /|
   +------+----+ |
   |  .---v--. | |
   |  | <##> | | |
   |  '------' | /
   | [::] [::] |/
   '-----------'
    /_/     /_/` },
  { id: 'portal', name: '传送门', code: '05 / REMOTE GATE', x: 50, y: 77, art: String.raw`       .-====-.
     .' / :: \ '.
    / .' .--. '. \
   | / .' /\ '. \ |
   | | | <@@> | | |
   | \ '. \/ .' / |
    \ '. '--' .' /
     '. \ :: / .'
    __ '-====-' __
   /__|________|__\
`.trimEnd() },
  { id: 'test', name: '试炼场', code: '06 / TEST CHAMBER', x: 82, y: 73, art: String.raw`      __     __
     [==]   [==]
     |::|   |::|
     /  \   /  \
    / /\ \ / /\ \
   | <##> | <##> |
   | ~~~~ | ~~~~ |
   |______|______|
   [::]==========
    '------------'` },
  { id: 'hq', name: '指挥中心', code: '00 / NEURAL CORE', x: 50, y: 48, art: String.raw`          .-+--.
       .-' /|   '-.
      /   / |      \
     +---+--+-------+
     |  /   |      /|
     | +----+-----+ |
     |/     |    /  |
     +------+---+---+
      \    /   /  /
       '-.+---+.-'
    .:============:.
   /___[__CORE__]___\
`.trimEnd() },
  { id: 'utility', name: '通用站', code: '07 / AUX MODULE', x: 82, y: 48, art: String.raw`     .---------.
    /_________/|
    | [#] [#] ||
    |  .---.  ||
    |  | + |  ||
    |  '---'  |/
    '---------'` },
]
