import type { FacilityId } from '../model/types'
import { defaultFacilityNames } from '../model/setting'

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
  { id: 'archive', name: defaultFacilityNames.archive, code: '01 / MEMORY BANK', x: 18, y: 24, art: String.raw`     .____________.
    /____________/|
   | .----------. ||
   | | ## :: 01 | ||
   | | ## :: 10 | ||
   | | ## :: 01 | ||
   | '----------' ||
   | [===] [===] |/
   '-------------'
     /_/     /_/` },
  { id: 'web', name: defaultFacilityNames.web, code: '02 / UPLINK ARRAY', x: 50, y: 19, art: String.raw`     .  . | .  .
   .   \  |  /   .
    .---\ | /---.
     \ ::\|/:: /
      \ ::@:: /
       '==|=='
         [|]
      ___/|\___
     /___[+]___\
      '-------'` },
  { id: 'terminal', name: defaultFacilityNames.terminal, code: '03 / SHELL ACCESS', x: 82, y: 24, art: String.raw`    .____________.
   /____________/|
   | .--------. |||
   | | >_     | |||
   | | 010101 | |||
   | | ______ | ||/
   | '--------' |/
   '-----++-----'
    ____/||\____
   /_[]_[]_[]_[]/` },
  { id: 'workshop', name: defaultFacilityNames.workshop, code: '04 / PATCH FORGE', x: 18, y: 73, art: String.raw`         [===]
     .----||----.
    / ::  || :: /|
   +------+----+ |
   |  .---v--. | |
   |  | <##> | | |
   |  '------' | /
   | [::] [::] |/
   '-----------'
    /_/     /_/` },
  { id: 'portal', name: defaultFacilityNames.portal, code: '05 / REMOTE GATE', x: 50, y: 77, art: String.raw`       .-====-.
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
  { id: 'test', name: defaultFacilityNames.test, code: '06 / TEST CHAMBER', x: 82, y: 73, art: String.raw`      __     __
     [==]   [==]
     |::|   |::|
     /  \   /  \
    / /\ \ / /\ \
   | <##> | <##> |
   | ~~~~ | ~~~~ |
   |______|______|
   [::]==========
    '------------'` },
  { id: 'hq', name: defaultFacilityNames.hq, code: '00 / NEURAL CORE', x: 50, y: 48, art: String.raw`          .-+--.
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
  { id: 'utility', name: defaultFacilityNames.utility, code: '07 / AUX MODULE', x: 82, y: 48, art: String.raw`     .---------.
    /_________/|
    | [#] [#] ||
    |  .---.  ||
    |  | + |  ||
    |  '---'  |/
    '---------'` },
]
