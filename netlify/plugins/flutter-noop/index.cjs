exports.onPreBuild = async ({ utils }) => {
  utils.status.show({
    title: "Flutter plugin skipped",
    summary: "This project builds with Vite and does not require Flutter.",
  });
};
