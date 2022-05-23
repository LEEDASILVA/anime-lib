import fetch from 'node-fetch'
import CryptoJS from 'crypto-js'
import { load } from 'cheerio'

// example :
// goload.pro/streaming.php?id=NzY4MDU=&title=Bleach+%28Dub%29+Episode+1&typesub=DUB
// first ask for request! so:
// goload.pro/streaming.php?id=Bleach+%28Dub%29+Episode+1
// this request will give the rest ?

const getAjaxEncrypt = params =>
  `https://goload.pro/encryp-ajax.php?${new URLSearchParams(params).toString()}`
const getStreamUrl = params =>
  `https://goload.pro/streaming.php?${new URLSearchParams(params).toString()}`

// get all episodes
const getAjaxGogoLoad = params =>
  `https://ajax.gogo-load.com/ajax/load-list-episode?${new URLSearchParams(
    params,
  ).toString()}`

// search : https://gogoanime.gg//search.html?keyword=bleach
// details : https://gogoanime.gg/categorie?id=bleach-dub
const getGoGoAnime = (path, params) =>
  `https://gogoanime.gg/${path}${
    params && '?' + new URLSearchParams(params).toString()
  }`

// search : https://goload.pro/search.html?keyword=bleach
// TODO : goland does not let see the inspector !!!! XD
const getGoLoad = (path, params) =>
  `https://goload.pro/${path}${
    params && '?' + new URLSearchParams(params).toString()
  }`

// this repo contains the necessary keys
const fetchGogoanimeKey = async () => {
  const response = await fetch(
    'https://raw.githubusercontent.com/justfoolingaround/animdl-provider-benchmarks/master/api/gogoanime.json',
  )
  return await response.json()
}

export const searchAnime = async animeName => {
  let searchList = []
  const response = await fetch(
    getGoGoAnime('/search.html', { keyword: animeName }),
  )
  const $ = load(await response.text())
  $('div.last_episodes > ul > li').each((_, el) => {
    searchList.push({
      animeId: $(el).find('p.name > a').attr('href').split('/')[2],
      animeTitle: $(el).find('p.name > a').attr('title'),
      animeUrl: getGoGoAnime($(el).find('p.name > a').attr('href')),
    })
  })

  return searchList
}

// TODO : send error, detail saying that the name of the key should be specific !!
export const getAnimeDetails = async key => {
  const fullEpList = []
  const response = await fetch(getGoGoAnime(`/category/${key}`))

  const $ = load(await response.text())
  console.log($('div.anime_info_body_bg > h1').text())
  console.log($('div.anime_video_body').contents().text())
  const ep_start = $('ul.episode_page > li').first().find('a').attr('ep_start')
  const ep_end = $('ul.episode_page > li').last().find('a').attr('ep_end')
  const id = $('#movie_id').attr('value')
  const alias = $('#alias_anime').attr('value')

  const gogoLandList = await fetch(
    getAjaxGogoLoad({ ep_start, ep_end, id, default_ep: 0, alias }),
  )
  console.log(getAjaxGogoLoad({ ep_start, ep_end, id, default_ep: 0, alias }))
  const $$ = load(await gogoLandList.text())

  $$('#episode_related > li').each((_, el) => {
    fullEpList.push({
      episodeId: $(el).find('a').attr('href').split('/')[1],
      episodeNum: $(el).find(`div.name`).text().replace('EP ', ''),
      episodeUrl: BASE_URL + $(el).find(`a`).attr('href').trim(),
    })
    return fullEpList
  })
}

// TODO : make the stream with out the need of search or categories
// anime id will be the name of the anime whit the episode
// ex: Bleach-Dub-Episode-1
export const streamVideo = async animeId => {
  const { iv, key, second_key } = await fetchGogoanimeKey()

  const encryptedKey = CryptoJS.AES.encrypt(animeId, key, {
    iv: iv,
  })

  const response = await fetch(
    getAjaxEncrypt({ id: encryptedKey, alias: animeId }),
  )
  // console.log(headers)
  console.log(response)
}

// --------------------------
// usage examples
// streamVideo('Bleach-Dub-Episode-1')
const searchList = await searchAnime('bleach')
const [{ animeId }] = searchList.filter(
  ({ animeId }) => animeId === 'bleach-dub',
)
// ? here last thing done, the functions is not working very well !
console.log(await getAnimeDetails(animeId))
