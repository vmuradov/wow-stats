import { useState, useEffect } from "react";
import styles from "./web-page.module.css";
import "./index.css";
import { wowClassInfo } from "../../components/utility/wow-class-info";

const WebPage = () => {
  const [guildName, setGuildName] = useState("");
  const [serverName, setServerName] = useState("");
  const [guildDataTable, setGuildDataTable] = useState("");

  const clientId = "3bcdab919674467d9f0547c414873a86";
  const clientSecret = "IEIAl53ewRPuaWsH95vwXiF0yu38Aw3a";

  // using clientID and clientSecret get access token -key card to blizzard API-
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
    return data.access_token;

  } catch (error) {
    console.error("Error Fetching Access Token From Blizzard API:", error);
  }
}

  // using access token fetch guild data from blizzard API
  async function fetchGuildData(server='benediction', guild='armor-is-for-noobs', namespace='profile-classic-us', locale='en_US') {
    try {
      const token = await getAccessToken(); // <-- wait for token
      const res = await fetch(`https://us.api.blizzard.com/data/wow/guild/${server}/${guild}/roster?namespace=${namespace}&locale=${locale}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setGuildDataTable(data);

    } catch (error) {
      console.error("Error Fetching Guild Data From Blizzard API:", error);
    }
  }

  async function fetchPlayerData(server='benediction', characterName, namespace='profile-classic-us', locale='en_US') {
    try {
      const token = await getAccessToken(); // <-- wait for token
      const res = await fetch(`https://us.api.blizzard.com/profile/wow/character/${server}/${characterName}?namespace=${namespace}&locale=${locale}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setGuildDataTable(data);

    } catch (error) {
      console.error("Error Fetching Player Data From Blizzard API:", error );
    }
  }

  useEffect(() => {
    fetchGuildData();
  }, []);

  return (
    <div className={`${styles.fullPageSize} container`}>
      <input
        type="text"
        placeholder="Enter Guild Name"
        value={guildName}
        onChange={(e) => setGuildName(e.target.value)}
      />
      

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
          {guildDataTable?.members?.map((toon, index) => (
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
              <td>
                <a 
                  href={`https://classic.warcraftlogs.com/character/us/benediction/${toon?.character?.name}`}
                  target="_blank" rel="noopener noreferrer" 
                >
                  {toon.parse}
                </a>
              </td>
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