import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Location } from '../../models/location.model';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class SearchBarComponent implements OnInit {
  @Input() results: Location[] = [];
  @Output() search = new EventEmitter<string>();
  @Output() locationSelect = new EventEmitter<Location>();

  searchControl = new FormControl('');

  ngOnInit() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      const searchValue = value || '';
      if (searchValue.length >= 2 || searchValue === '') {
        this.search.emit(searchValue);
      }
      if (!searchValue) {
        this.results = [];
      }
    });
  }

  onLocationClick(location: Location) {
    this.locationSelect.emit(location);
    this.searchControl.setValue('', { emitEvent: false });
    this.results = [];
  }

  getFormattedAddress(location: Location): string {
    const address = location.address;
    return [
      address?.street,
      address?.city,
      address?.state,
      address?.country
    ].filter(Boolean).join(', ');
  }
} 