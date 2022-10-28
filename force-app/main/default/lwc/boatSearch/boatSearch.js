import { LightningElement } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import BOAT from "@salesforce/schema/Boat__c";
import NAME_FIELD from "@salesforce/schema/Boat__c.Name";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class BoatSearch extends NavigationMixin(LightningElement) {
  fields = [NAME_FIELD];

  objectApiName = BOAT;
  selectedBoatTypeId;
  isLoading = false;
  error;

  handleChange(e) {
    this.selectedBoatTypeId = e.detail;
    console.log("top level", e.detail.boatTypeId);
  }

  // Handles loading event
  handleLoading() {
    this.isLoading = true;
  }

  // Handles done loading event
  handleDoneLoading() {
    this.isLoading = false;
  }

  // Handles search boat event
  // This custom event comes from the form
  searchBoats(event) {
    const boatTypeId = event.detail.boatTypeId;
    this.template
      .querySelector("c-boat-search-results")
      .searchBoats(boatTypeId);
    this.handleDoneLoading();
  }

  createNewBoat() {
    this[NavigationMixin.Navigate]({
      type: "standard__objectPage",
      attributes: {
        objectApiName: "Boat__c",
        actionName: "new"
      }
    });
  }

  handleSuccess(event) {
    const evt = new ShowToastEvent({
      title: "Account created",
      message: "Record ID: " + event.detail.id,
      variant: "success"
    });
    this.dispatchEvent(evt);
  }
}
