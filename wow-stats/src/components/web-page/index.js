/*. 
  Dev Notes: 
  
  Async funcs render at their own speed. Imagine main program flow continueing 
  while Async branches off, then reconnects once finished execution.

  Await pauses execution until the promise made by the branched off Async is resolved.
*/

import { useState, useEffect } from "react";
import styles from "./web-page.module.css";
import { wowClassInfo, wowServerList, guildTableSortingOptions } from "../api/wow-info";

const WebPage = () => {
  const wowClientId = "c356c5e8c3ec4573b82f631a5da7c9cc";
  const wowClientSecret = "H0TBuu0X45pmU9Gz4tIZAhmTMeMGSmEI";
  const [wowAccessToken, setWowAccessToken] = useState(""); // access token retrieved from client & secret that allows us to call APIs

  const logClientId = "a00b716e-06ba-46e0-ab09-c0c5fb523413";
  const logClientSecret = "zblbGQOJ7q5Qw4Q1q6jdtpkFGydZlQYBgD4rFwwq";
  const [logAccessToken, setLogAccessToken] = useState("");

  const logAuthApi = "https://classic.warcraftlogs.com/oauth/token"
  const wowAuthApi = "https://us.battle.net/oauth/token"

  const [guildName, setGuildName] = useState(""); // user input guild name
  const formattedGuildName = guildName?.replaceAll(" ", "-")?.toLowerCase(); // format guild name for api calls
  const [serverName, setServerName] = useState(""); // user input server name
  
  const [guildDataTable, setGuildDataTable] = useState(""); // guild data from blizzard API we concat with player data
  
  const [sortingOption, setSortingOption] = useState(guildDataTable[0]);

  // using clientID and clientSecret get access token -key card to blizzard API-
  useEffect(() => {
    async function getAccessToken(clientId, clientSecret, api, setAccessToken) { // wont pause app renders while processing
      try {
        const res = await fetch(api, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + btoa(clientId + ":" + clientSecret),
          },
          body: "grant_type=client_credentials",
        }); // 20 - 27 POST call to receive response object containing access token

        const data = await res.json(); // pauses execution inside the func while promise resolves and we get the access token data
        setAccessToken(data?.access_token); // set actual token

      } catch (error) {
        console.error("Error Fetching Access Token From Blizzard API:", error);
      }
    }

    getAccessToken(wowClientId, wowClientSecret, wowAuthApi, setWowAccessToken);
    getAccessToken(logClientId, logClientSecret, logAuthApi, setLogAccessToken);
  }, []); // empty dependency array so it only runs once on load

  // using access token fetch guild data from blizzard API
  async function fetchGuildData(server, guild, namespace, locale) {
    try {
      const res = await fetch(`https://us.api.blizzard.com/data/wow/guild/${server}/${guild}/roster?namespace=${namespace}&locale=${locale}`, {
        headers: { Authorization: `Bearer ${wowAccessToken}` },
      }); // api call to get guild data

      const data = await res.json(); // pauses execution inside func while we get the guild data in json form
      setGuildDataTable(data); // once promise resolved set guild data

      // call both api's with list of guild members -data.members- to fetch player data and parses to concat with guild data
      setGuildDataTable({ ...data, members: 
        await fetchPlayerParseData(server,
          await fetchAllPlayers(server, data.members, namespace, locale),
        "US"),
      });


    } catch (error) {
      console.error("Error Fetching Guild Data From Blizzard API:", error);
    }
  }

  // concatanates all player data to guild data using list of all guild members
  async function fetchAllPlayers(server, members, namespace, locale) {
    if (!members || members?.length === 0) return; // if no members, exit function

    try {
      const requests = members.map((member) =>
        fetch(`https://us.api.blizzard.com/profile/wow/character/${server}/${member?.character?.name?.toLowerCase()}?namespace=${namespace}&locale=${locale}`,
          { headers: { Authorization: `Bearer ${wowAccessToken}` } }
        )
          .then((res) => res.ok ? res.json() : null) // each fetch returns a promise of a member's data or null on 404
          .catch(() => null)
      ); // map over members to create array of fetch promises

      const results = await Promise.all(requests); // resolve all promises to get array of player data / nulls

      const merged = members.map((member, index) => ({ // loop through each guild-member fetched from fetchGuildData API
        ...member,
        player: results[index], // adds new property "player" to merged with player data retrieved from API
      }));

      // setGuildDataTable((prev) => ({ ...prev, members: merged }));
      return merged; // replaces or adds members property guildDataTable
    } catch (error) {
      console.error("Error Fetching Player Data:", error);
    }
  }

  async function getLoggedPlayerId(token, name, serverSlug, region) {
    const query = `
      {
        characterData {
          character(name: "${name}", serverSlug: "${serverSlug}", serverRegion: "${region}") {
            id
          }
        }
      }
    `;
    const res = await fetch("https://classic.warcraftlogs.com/api/v2/client", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });
    const j = await res.json();
    return j?.data?.characterData?.character?.id;
  }

  async function getParse(charId, metric) {
    const query = `
      {
        characterData {
          character(id: ${charId}) {
            name
            zoneRankings(metric: ${metric})
          }
        }
      }
    `;
    const res = await fetch("https://classic.warcraftlogs.com/api/v2/client", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${logAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });
    const j = await res.json();
    return j?.data?.characterData?.character?.zoneRankings;
  }

  async function fetchPlayerParseData(server, members, region) {

    const finalDT = await Promise.all( members?.map(async (member, index) => {
        const metric = (wowClassInfo[member?.player?.character_class?.id]?.spec) // Look Throigh the wowClassInfo object
                        ?.find(obj => obj[member?.player?.active_spec?.name]) // IF you find the key-val pair
                          ?.[member?.player?.active_spec?.name];  // check if undefined ?. & access @ key
        const metricType = metric === "Healer" ? "hps" : "dps";
        const wlogsPlayerId = await getLoggedPlayerId(logAccessToken, member?.character.name, server, region);
        const wlogsPlayerParse = await getParse(wlogsPlayerId, metricType);
        return { ...member, playerId: wlogsPlayerId, parse: wlogsPlayerParse };
      })
    );

    return finalDT;
  }

  return (
    <div className={`${styles.fullPageSize} container`}>
      <div className={styles.dropdownContainer}>
        <input
          type="text"
          placeholder="Enter Guild Name"
          value={guildName}
          onChange={(e) => setGuildName(e.target.value)}
          onKeyDown={(e) => {
          if (e.key === "Enter" && guildName && serverName)
            fetchGuildData(serverName, guildName, "profile-classic-us", "en_US");
          }}
        />

        <select
          value={serverName}
          onChange={(e) => setServerName(e.target.value)}
        > 
          <option value="" disabled> Select Server </option>
          {wowServerList?.servers?.map((server, index) => (
            <option key={index} value={server?.toLowerCase()}>
              {server}
            </option>
          ))}
        </select>

        <button
          onClick={() => { fetchGuildData(serverName, formattedGuildName, 'profile-classic-us', 'en_US'); }}
          disabled={!guildName || !serverName}
          className={styles.searchButton}
        >
          <span> Search </span>
        </button>
      </div>

      {(guildDataTable.members &&
        <div>
          {/* Sorting Dropdown */}
          <div className={`${styles.sortSelect}`}>
            <select value={sortingOption} onChange={(e) => setSortingOption(e.target.value)} disabled style={{opacity: "0.6", cursor: "not-allowed"}} >
              {/* select value makes component controlled and insures that selected option is in sync with var */}
              {guildTableSortingOptions?.options?.map((option, index) => ( // map over my sorting options array
                <option key={index} value={option}> {/* <option>'s value becomes e.target.value, onChange updates sortingOption state */}
                  {option}
                </option>
              ))}
            </select>
          </div>
        
          <table className={`${styles.guildTable}`}>
            <thead>
              <tr>
                <th> lvl </th>
                <th> Class </th>
                <th> Name </th>
                <th> Guild Rank </th>
                <th> ilvl </th>
                <th> Role </th>
                <th> Parse AVG </th>
                <th> Last Active </th>
                <th> Achievement Points </th>
              </tr>
            </thead>

            <tbody>
              {guildDataTable?.members?.map((toon, index) => (
                <tr key={index}>
                  <td> { toon?.character?.level } </td>
                  <td>
                    <img 
                      alt=""
                      src={ toon?.player ?
                        wowClassInfo[toon?.player?.character_class?.id]?.icon
                          ?.find(obj => obj[toon?.player?.active_spec?.name])?.[toon?.player?.active_spec?.name] ||
                           wowClassInfo[toon?.character?.playable_class?.id]?.defaultIcon : 
                        wowClassInfo[toon?.character?.playable_class?.id]?.defaultIcon
                      }
                    />
                  </td>
                  <td>
                    <a 
                      href={`https://classic-armory.org/character/us/mop/${serverName}/${toon?.character?.name}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ color: wowClassInfo[toon?.character?.playable_class?.id]?.color }}
                    >
                      {toon?.character?.name}
                    </a>
                  </td>
                  <td> 
                    {toon?.rank === 0 ? "Guild Master" : toon?.rank === 1 ? "Officer" : "---"} 
                  </td>
                  <td> {toon?.player ? toon?.player?.equipped_item_level : "---"} </td>
                  <td>
                    {toon?.player?.active_spec?.name ?
                      (wowClassInfo[toon?.player?.character_class?.id]?.spec) // Look Throigh the wowClassInfo object
                        ?.find(obj => obj[toon?.player?.active_spec?.name]) // IF you find the key-val pair
                          ?.[toon?.player?.active_spec?.name]  // check if undefined ?. & access @ key
                        : "---"
                      }
                  </td>
                  <td>
                    <a 
                      href={`https://classic.warcraftlogs.com/character/us/${serverName}/${toon?.character?.name}`}
                      target="_blank" rel="noopener noreferrer"
                    >
                      <span style={{color: "black"}}>
                        {toon?.parse?.bestPerformanceAverage ?
                          toon?.parse?.difficulty === 4 ? "Heroic" : 
                          toon?.parse?.difficulty === 3 ? "Normal" : 
                          "" : 
                        ""
                        }
                      </span>
                      <br />
                      <span style={{ color: (toon?.parse?.bestPerformanceAverage === 100 ? "tan" :
                                            toon?.parse?.bestPerformanceAverage >= 99 ? "pink" :
                                            toon?.parse?.bestPerformanceAverage >= 95 ? "orange" :
                                            toon?.parse?.bestPerformanceAverage >= 75 ? "purple" :
                                            toon?.parse?.bestPerformanceAverage >= 50 ? "blue" :
                                            toon?.parse?.bestPerformanceAverage >= 25 ? "green" : "gray"
                                          )
                                    }}
                      >
                        {toon?.parse?.bestPerformanceAverage ? `${parseFloat(toon?.parse?.bestPerformanceAverage).toFixed(2)}` : "N/A"}
                      </span>
                    </a>
                  </td>
                  <td> { toon?.player ? new Date(toon?.player?.last_login_timestamp)?.toLocaleDateString() : "---" } </td>
                  <td> { toon?.player ? toon?.player?.achievement_points : "---" } </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};

export default WebPage;