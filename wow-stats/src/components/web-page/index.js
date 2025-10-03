import { useState, useEffect } from "react";
import styles from "./web-page.module.css";
import "./index.css";
import { wowClassInfo } from "../../components/utility/wow-class-info";

const dataTable = [
  {
    lvl: "90",
    class: "Shaman",
    name: "Zapyzap",
    grank: "Member",
    ilvl: "508",
    role: "DPS",
    parse: "99%",
    lastActive: "2025-03-15",
  },
  {
    lvl: "90",
    class: "Druid",
    name: "Eddy",
    grank: "Goat",
    ilvl: "508",
    role: "Healer",
    parse: "100%",
    lastActive: "2025-05-15",
  },
];

const WebPage = () => {
  const [guildName, setGuildName] = useState("");
  const [serverName, setServerName] = useState("");
  const [dataTable, setDataTable] = useState("");

  const clientId = "3bcdab919674467d9f0547c414873a86";
  const clientSecret = "IEIAl53ewRPuaWsH95vwXiF0yu38Aw3a";

  // using clientID and clientSecret get access token -key card to blizzard API-
  function getAccessToken() {
    return fetch("https://us.battle.net/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(clientId + ":" + clientSecret),
      },
      body: "grant_type=client_credentials",
    })
    .then(res => res.json())
    .then(data => data.access_token)
    .catch(error => { console.error("Error Fetching Access Token From Blizzard API:", error ); });
  }

  function fetchGuildData(server='benediction', guild='armor-is-for-noobs', namespace='profile-classic-us', locale='en_US') {
    return fetch(`https://us.api.blizzard.com/data/wow/guild/${server}/${guild}/roster?namespace=${namespace}&locale=${locale}`, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    })
    .then(res => res.json())
    .then(data => setDataTable(data))
    .catch(error => { console.error("Error Fetching Guild Data From Blizzard API:", error ); });
  }

  function fetchPlayerData(server='benediction', characterName, namespace='profile-classic-us', locale='en_US') {
    return fetch(`https://us.api.blizzard.com/profile/wow/character/${server}/${characterName}?namespace=${namespace}&locale=${locale}`, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    })
    .then(res => res.json())
    .then(data => setDataTable(data))
    .catch(error => { console.error("Error Fetching Player Data From Blizzard API:", error ); });
  }

  useEffect(() => {
    fetchGuildData();
  }, []);

  return (
    <div className={`${styles.fullPageSize} container`}>
      React App for WoW Stats.
      <input
        type="text"
        placeholder="Enter Guild Name"
        value={guildName}
        onChange={(e) => setGuildName(e.target.value)}
      />
      <h3> Guild Name: {guildName} </h3>
      {/* src={`https://classic-armory.org/character/us/mop/benediction/${characterName}`}
      src={`https://classic.warcraftlogs.com/character/us/benediction/${characterName}`} */}

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
          {dataTable?.members?.map((toon, index) => (
            <tr key={index}>
              <td>{toon?.character?.level}</td>
              <td>
                <img src={wowClassInfo[toon?.character?.playable_class?.id]?.icon} />
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
              <td>{toon.rank}</td>
              <td>{toon.ilvl}</td>
              <td>{toon.role}</td>
              <td>{toon.parse}</td>
              <td>{new Date(toon.lastActive).toLocaleDateString()}</td>
              <td>{toon.parse}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
};

export default WebPage;