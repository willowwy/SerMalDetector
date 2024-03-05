export var Classifier;
(function (Classifier) {
    Classifier["RF"] = "RF";
    Classifier["SVM"] = "SVM";
    Classifier["NB"] = "NB";
    Classifier["MLP"] = "MLP";
})(Classifier || (Classifier = {}));
const config = {
    positionRecorder: null,
    classifier: Classifier.SVM
};
export const getConfig = () => config;
export const setPositionRecorder = (positionRecorder) => {
    config.positionRecorder = positionRecorder;
};
export const setClassifier = (classifier) => {
    config.classifier = classifier;
};
//# sourceMappingURL=config.js.map