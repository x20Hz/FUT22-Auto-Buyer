module.exports = {
    headers: {
      name: "FIFA 22 AUTOBUYER",
      namespace: "http://tampermonkey.net/",
      version: "1V1",
      description: "FIFA 22 Auto Buyer",
      author: "x20Hz",
      match: [
        "https://www.ea.com/*/fifa/ultimate-team/web-app/*",
        "https://www.ea.com/fifa/ultimate-team/web-app/*",
      ],
      grant: ["GM_xmlhttpRequest"],
      connect: ["ea.com", "ea2.com", "futbin.com", "discordapp.com"],
      require: [
        "https://github.com/chithakumar13/fut-trade-enhancer/releases/latest/download/fut-trade-enhancer.user.js",
        "https://raw.githubusercontent.com/discordjs/discord.js/webpack/discord.11.6.4.min.js",
      ],
      updateURL:
        "https://github.com/x20Hz/FIFA22-Auto-Buyer/releases/latest/download/fifa-auto-buyer.user.js",
      downloadURL:
        "https://github.com/x20Hz/FIFA22-Auto-Buyer/releases/latest/download/fifa-auto-buyer.user.js",
      noFrame: true,
    },
  };
