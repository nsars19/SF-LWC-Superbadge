import { LightningElement, wire, api } from "lwc";
import updateBoatList from "@salesforce/apex/BoatDataService.updateBoatList";
import getBoats from "@salesforce/apex/BoatDataService.getBoats";
import { publish, MessageContext } from "lightning/messageService";
import BOATMC from "@salesforce/messageChannel/BoatMessageChannel__c";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { refreshApex } from "@salesforce/apex";

const SUCCESS_TITLE = "Success";
const MESSAGE_SHIP_IT = "Ship it!";
const SUCCESS_VARIANT = "success";
const ERROR_TITLE = "Error";
const ERROR_VARIANT = "error";

export default class BoatSearchResults extends LightningElement {
  columns = [
    { label: "Name", fieldName: "Name", editable: true, type: "text" },
    {
      label: "Price",
      fieldName: "Price__c",
      type: "currency",
      editable: true,
      typeAttributes: { currencyCode: "USD", step: "0.01" }
    },
    {
      label: "Length",
      fieldName: "Length__c",
      editable: true,
      type: "number"
    },
    {
      label: "Description",
      fieldName: "Description__c",
      editable: true,
      type: "text"
    }
  ];
  selectedBoatId;
  boatTypeId = "";
  boats = [];
  isLoading = false;

  // wired message context
  @wire(MessageContext)
  messageContext;

  // wired getBoats method
  @wire(getBoats, { boatTypeId: "$boatTypeId" })
  wiredBoats(result) {
    this.boats = result;
  }

  // public function that updates the existing boatTypeId property
  // uses notifyLoading
  @api searchBoats(boatTypeId) {
    this.isLoading = true;
    this.boatTypeId = boatTypeId;
    this.notifyLoading(this.isLoading);
  }

  // this public function must refresh the boats asynchronously
  // uses notifyLoading
  @api async refresh() {
    this.notifyLoading(true);
    refreshApex(this.boats).finally(() => {
      this.notifyLoading(false);
    });
  }

  // this function must update selectedBoatId and call sendMessageService
  updateSelectedTile(event) {
    this.selectedBoatId = event.detail.boatId;
    this.sendMessageService(this.selectedBoatId);
  }

  // Publishes the selected boat Id on the BoatMC.
  sendMessageService(boatId) {
    // explicitly pass boatId to the parameter recordId
    publish(this.messageContext, BOATMC, { recordId: boatId });
  }

  // The handleSave method must save the changes in the Boat Editor
  // passing the updated fields from draftValues to the
  // Apex method updateBoatList(Object data).
  // Show a toast message with the title
  // clear lightning-datatable draft values
  handleSave(event) {
    // notify loading
    this.notifyLoading(true);

    const updatedFields = event.detail.draftValues;
    // Update the records via Apex
    updateBoatList({ data: updatedFields })
      .then(() => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: SUCCESS_TITLE,
            message: MESSAGE_SHIP_IT,
            variant: SUCCESS_VARIANT
          })
        );

        this.refresh();
      })
      .catch((error) => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: ERROR_TITLE,
            message: error.message,
            variant: ERROR_VARIANT
          })
        );
      })
      .finally(() => {
        this.template.querySelector("lightning-datatable").draftValues = [];
        this.isLoading = false;
        this.notifyLoading(this.isLoading);
      });
  }
  // Check the current value of isLoading before dispatching the doneloading or loading custom event
  notifyLoading(isLoading) {
    if (isLoading) {
      this.dispatchEvent(new CustomEvent("loading"));
    } else {
      this.dispatchEvent(new CustomEvent("doneloading"));
    }
  }
}
