import { SurveyCreator } from "survey-creator-react";
import { SurveyCreatorModel } from "survey-creator-core";

const KEY = "ZTkwZWEyZTAtYWU5Mi00NGJlLTliZDAtNGZjODMyZGFkNGQ5OzE9MjAyNi0xMi0yMw";

SurveyCreator.license = KEY;
SurveyCreatorModel.license = KEY;

console.log("react license:", SurveyCreator.license?.slice(0, 8));
console.log("core  license:", SurveyCreatorModel.license?.slice(0, 8));