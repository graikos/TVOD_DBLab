from storage import dbconn

class Season:
    def __init__(self, season_id, show_id, season_number, episodes):
        self.season_id = season_id
        self.show_id = show_id
        self.season_number = season_number
        self.episodes = episodes

    def to_dict(self):
        return {
            "season_id": self.season_id,
            "show_id": self.show_id,
            "season_number": self.season_number,
            "episodes": self.episodes
        }

    @staticmethod
    def get_show_seasons_by_id(show_id):
        cur = dbconn.cursor()
        cur.execute("SELECT season_id,show_id,season_number,episodes FROM season WHERE show_id=%s", (show_id,))
        res = cur.fetchall()
        cur.close()

        seasons = []
        for season in res:
            seasons.append(Season(*season))

        return seasons