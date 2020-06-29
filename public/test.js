const host = "http://localhost:8080";
let koItem;

$(document).ready(() => {
    initPage();
});

const initPage = () => {
    makePostRequest("/getRandomItem", {}, (resp) => {
        let item = resp.item;
        // Activates knockout.js
        koItem = new ArchiveItemModel(item);
        ko.applyBindings(koItem);
    });
};

const getNewItem = (field) => {
    makePostRequest("/findMatch",  {field: field, id: koItem.id()}, (resp) => {
        let item = resp.data.item;
        koItem.language(item.language);
        koItem.type(item.type);
        koItem.location(item.location);
        koItem.temporal(item.temporal);
        koItem.issue_date(item.issue_date);
        koItem.url(item.url);
        koItem.relation(item.relation);
        koItem.collection(item.collection);
        koItem.id(item.id);
    });
};

const makePostRequest = (path, data, success) => {
    $.ajax({
        type: "POST",
        url: host + path,
        data: data,
        success: success
    });
};
// This is a simple *viewmodel* - JavaScript that defines the data and behavior of your UI
function ArchiveItemModel(item) {
    this.language = ko.observable(item.language);
    this.type = ko.observable(item.type);
    this.location = ko.observable(item.location);
    this.temporal = ko.observable(item.temporal);
    this.issue_date = ko.observable(item.issue_date);
    this.url = ko.observable(item.url);
    this.relation = ko.observable(item.relation);
    this.collection = ko.observable(item.collection);
    this.id = ko.observable(item.id);

    this.getNewItem = getNewItem;
}