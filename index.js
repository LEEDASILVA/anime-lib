import fetch from 'node-fetch'
import { load } from 'cheerio'

// get all episodes
const getAjaxGogoLoad = params =>
  `https://ajax.gogo-load.com/ajax/load-list-episode?${new URLSearchParams(
    params,
  ).toString()}`

// search : https://gogoanime.gg//search.html?keyword=bleach
// details : https://gogoanime.gg/categorie?id=bleach-dub
const getGoGoAnime = (path, params) =>
  `https://gogoanime.gg${path}${
    params ? '?' + new URLSearchParams(params).toString() : ''
  }`

// search : https://goload.pro/search.html?keyword=bleach
// stream video : https://goload.pro/streaming.php?id=MTIxOTc5&title=Bleach+%28Dub%29+Episode+366&typesub=DUB
// goland does not let see the inspector !!!! XD
const getGoLoad = (path, params) =>
  `https://goload.pro/${path}${
    params && '?' + new URLSearchParams(params).toString()
  }`

// TODO : see what i can do with this
// ? this repo contains the necessary keys for streaming
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
  $('div.last_episodes > ul > li').each((_, v) => {
    searchList.push({
      animeId: $(v).find('p.name > a').attr('href').split('/')[2],
      animeTitle: $(v).find('p.name > a').attr('title'),
      animeUrl: getGoGoAnime($(v).find('p.name > a').attr('href')),
    })
  })

  return searchList
}

// TODO : take care of error, and better performance!
export const getFullAnimeEpisodes = async key => {
  const fullEpList = []
  const response = await fetch(getGoGoAnime(`/category/${key}`))

  const $ = load(await response.text())
  const ep_start = 1
  const ep_end = $('#episode_page > li').last().find('a').attr('ep_end')
  const id = $('#movie_id').attr('value')
  const alias = $('#alias_anime').attr('value')

  const gogoLandList = await fetch(
    getAjaxGogoLoad({ ep_start, ep_end, id, default_ep: 0, alias }),
  )
  const $$ = load(await gogoLandList.text())

  $$('#episode_related > li').each((_, el) => {
    fullEpList.push({
      episodeId: $(el).find('a').attr('href').split('/')[1],
      episodeNum: $(el).find(`div.name`).text().replace('EP ', ''),
      episodeUrl: `${getGoGoAnime('')}${$(el).find(`a`).attr('href').trim()}`,
    })
  })
  return fullEpList
}

export const streamingUrl = async episodeId => {
  const gogoDomain = getGoGoAnime('/')
  const normalized = episodeId.includes(gogoDomain)
    ? episodeId.slice(gogoDomain.length)
    : episodeId
  const gogoEpisodeResponse = await fetch(getGoGoAnime(`/${normalized}`))
  const $ = load(await gogoEpisodeResponse.text())
  return `https:${$('div.play-video > iframe').attr('src')}`
}
