import {
  idAutoBuyerFoundLog,
  idProgressAutobuyer
} from "../elementIds.constants";
import {autoRestartAutoBuyer, startAutoBuyer, stopAutoBuyer} from "../handlers/autobuyerProcessor";
import { updateStats } from "../handlers/statsProcessor";
import {
  getValue,
  increAndGetStoreValue,
  setValue
} from "../services/repository";
import {
  convertRangeToSeconds, convertSecondsToTime,
  getRandNum,
  getRandNumberInRange,
  hideLoader,
  showLoader
} from "./commonUtil";
import { writeToLog } from "./logUtil";
import { sendNotificationToUser, sendUINotification } from "./notificationUtil";
import bypassSoftban from "./softbanUtil";
import { loadFilter } from "./userExternalUtil";

let stopAfter, pauseCycle;

export const stopBotIfRequired = (buyerSetting) => {
  const purchasedCardCount = getValue("purchasedCardCount");
  const cardsToBuy = buyerSetting["idAbCardCount"];

  const botStartTime = getValue("botStartTime").getTime();
  const BotTimeATM = getValue("botTimeATM").getTime();
  let time = stopAfter || convertRangeToSeconds(buyerSetting["idAbStopAfter"]);
  if (!stopAfter) {
    stopAfter = time;
  }
  let sendDetailedNotification = buyerSetting["idDetailedNotification"];
  let currentTime = new Date().getTime();
  let restartTime = 0;
  if (getValue("RestartTime")) {
    restartTime = getValue("RestartTime");
  }
  let timeElapsed = (currentTime - (BotTimeATM + restartTime)) / 1000 >= time;
  const isSelling = false;
  // buyerSetting["idSellCheckBuyPrice"] || buyerSetting["idSellFutBinPrice"];
  const isTransferListFull =
      isSelling &&
      repositories.Item &&
      repositories.Item.transfer.length >=
      repositories.Item.pileSizes._collection[5];

  const message = timeElapsed
      ? "Time elapsed"
      : isTransferListFull
          ? "Transfer list is full"
          : "Max purchases count reached";

  if (timeElapsed){
    stopAfter = null;
    if (buyerSetting["idAbRestartAfter"]) {
      setValue("RestartTime", convertRangeToSeconds(buyerSetting["idAbRestartAfter"]));
      const autoRestart = getValue("RestartTime");
      if (!getValue("TotalRestartSeconds")) setValue("TotalRestartSeconds", 0)
      setValue("TotalRestartSeconds", getValue("TotalRestartSeconds") + autoRestart);
      stopAutoBuyer(false);

      writeToLog(
          `Autobuyer stopped (Time elapsed) | Automatic restart in ${convertSecondsToTime(autoRestart)}`,
          idProgressAutobuyer
      );
      autoRestartAutoBuyer();
    }else {
      writeToLog(
          `Autobuyer stopped (Time elapsed) | No automatic restart`,
          idProgressAutobuyer
      );
      stopAutoBuyer(false);
    }

  } else {
    if (isTransferListFull || (cardsToBuy && purchasedCardCount >= cardsToBuy)) {

      if (sendDetailedNotification)
        sendNotificationToUser(`Autobuyer stopped | ${message}`);
      writeToLog(`Autobuyer stopped | ${message}`, idProgressAutobuyer);
      stopAfter = null;
      stopAutoBuyer();
    }
  }
};

export const pauseBotIfRequired = async function (buyerSetting) {
  const isBuyerActive = getValue("autoBuyerActive");
  if (!isBuyerActive) return;
  const pauseFor = convertRangeToSeconds(buyerSetting["idAbPauseFor"]) * 1000;
  const cycleAmount =
      pauseCycle || getRandNumberInRange(buyerSetting["idAbCycleAmount"]);
  if (!pauseCycle) {
    pauseCycle = cycleAmount;
  }
  const { searchCount, previousPause } = getValue("sessionStats");

  if (getValue("softbanDetected") === true && buyerSetting["idBypassSoftBan"])
  {
    setValue("softbanDetected", false)
    showLoader()
    stopAutoBuyer(true);
    const isBypassed = await bypassSoftban()
    hideLoader()
    if (isBypassed)
    {
      sendUINotification("Softban successfully bypassed");
      startAutoBuyer.call(this, true);
    }
    else
      sendUINotification("Softban cant be bypassed");
  }
  if (searchCount && !((searchCount - previousPause) % cycleAmount)) {
    updateStats("previousPause", searchCount);
    stopAutoBuyer(true);
    return setTimeout(() => {
      pauseCycle = getRandNumberInRange(buyerSetting["idAbCycleAmount"]);
      startAutoBuyer.call(this, true);
    }, pauseFor);
  }
};

export const switchFilterIfRequired = async function () {
  const availableFilters = getValue("selectedFilters");
  const fiterSearchCount = getValue("fiterSearchCount");
  const currentFilterCount = getValue("currentFilterCount");
  if (
      !availableFilters ||
      !availableFilters.length ||
      fiterSearchCount > currentFilterCount
  ) {
    increAndGetStoreValue("currentFilterCount");
    return false;
  }
  setValue("currentFilterCount", 1);
  setValue("currentPage", 1);
  const currentFilterIndex = getValue("currentFilterIndex") || 0;
  let filterIndex = getValue("runSequentially")
      ? currentFilterIndex % availableFilters.length
      : getRandNum(0, availableFilters.length - 1);

  setValue("currentFilterIndex", filterIndex + 1);
  let filterName = availableFilters[filterIndex];
  await loadFilter.call(this, filterName);
  writeToLog(
      `---------------------------  Running for filter ${filterName}  ---------------------------------------------`,
      idAutoBuyerFoundLog
  );
};
