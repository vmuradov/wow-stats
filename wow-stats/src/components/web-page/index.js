import { useState, useEffect } from "react";
import styles from "./web-page.module.css";
import "./index.css";
import { wowClassInfo, wowServerList } from "../api/wow-info";

const WebPage = () => {
  const [accessToken, setAccessToken] = useState(""); // access token from blizzard API

  const [guildName, setGuildName] = useState(""); // user input guild name
  const [serverName, setServerName] = useState(""); // user input server name
  const formattedGuildName = guildName.replaceAll(" ", "-").toLowerCase(); // format guild name for api calls

  const [guildDataTable, setGuildDataTable] = useState(""); // guild data from blizzard API
  const [playerDataTable, setPlayerDataTable] = useState([]); // array of guild member data from blizzard API

  const clientId = "3bcdab919674467d9f0547c414873a86";
  const clientSecret = "IEIAl53ewRPuaWsH95vwXiF0yu38Aw3a";

  // using clientID and clientSecret get access token -key card to blizzard API-
  useEffect(() => {
    async function getAccessToken() {
      try {
        const res = await fetch("https://us.battle.net/oauth/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + btoa(clientId + ":" + clientSecret),
          },
          body: "grant_type=client_credentials",
        });

        const data = await res.json();
        setAccessToken(data.access_token); // set actual token
      } catch (error) {
        console.error("Error Fetching Access Token From Blizzard API:", error);
      }
    }

    getAccessToken();
  }, []);

  // using access token fetch guild data from blizzard API
  async function fetchGuildData(server, guild, namespace, locale) {
    try {
      const res = await fetch(`https://us.api.blizzard.com/data/wow/guild/${server}/${guild}/roster?namespace=${namespace}&locale=${locale}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await res.json();
      setGuildDataTable(data);

      fetchAllPlayers(server, data.members, namespace, locale); // use list of guild members to fetch player data

    } catch (error) {
      console.error("Error Fetching Guild Data From Blizzard API:", error);
    }
  }

  async function fetchAllPlayers(server, members, namespace, locale) {
    if (!members || members.length === 0) return; // if no members, exit function

    try {
      const requests = members.map((member) =>
        fetch(`https://us.api.blizzard.com/profile/wow/character/${server}/${member.character.name.toLowerCase()}?namespace=${namespace}&locale=${locale}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        ).then((res) => res.json()) // each fetch returns a promise of a member's data
      );

      const results = await Promise.all(requests); // wait for all promises to resolve
      setPlayerDataTable(results); // set state with array of all members' data

    } catch (error) {
      console.error("Error Fetching Player Data:", error);
    }
  }


  return (
    <div className={`${styles.fullPageSize} container`}>
      <div className="input-dropdown-container">
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
            <option key={index} value={server.toLowerCase()}>
              {server}
            </option>
          ))}
        </select>

        <button
          onClick={() => { fetchGuildData(serverName, formattedGuildName, 'profile-classic-us', 'en_US'); }}
          disabled={!guildName || !serverName}
        >
          <span> Search </span>
        </button>

      </div>

      <table className="simple-table">
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
          {playerDataTable?.map((toon, index) => (
            <tr key={index}>
              <td> {toon?.level} </td>
              <td>
                <img alt="" src={wowClassInfo[toon?.character_class?.id]?.icon} />
              </td>
              <td>
                <a 
                  href={`https://classic-armory.org/character/us/mop/${serverName}/${toon?.character?.name}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ color: wowClassInfo[toon?.character_class?.id]?.color }}
                >
                  {toon?.name}
                </a>
              </td>
              <td> {toon.rank} </td>
              <td> {toon.equipped_item_level} </td>
              <td> {toon.active_spec.name} </td>
              <td>
                <a 
                  href={`https://classic.warcraftlogs.com/character/us/${guildName}/${toon?.character?.name}`}
                  target="_blank" rel="noopener noreferrer" 
                >
                  {toon.parse}
                </a>
              </td>
              <td> {new Date(toon.last_login_timestamp).toLocaleDateString()} </td>
              <td> {toon.achievement_points} </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
};

export default WebPage;