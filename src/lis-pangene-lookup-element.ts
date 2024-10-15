import {LitElement, PropertyValues, css, html} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {live} from 'lit/directives/live.js';
import {Ref, createRef, ref} from 'lit/directives/ref.js';

import {LisCancelPromiseController} from './controllers';
import {LisLoadingElement} from './core';
import {
  DownloadFunction,
  LisPaginatedSearchMixin,
  PaginatedSearchData,
  SearchOptions,
} from './mixins';

/**
 * The data used to construct the lookup form in the
 * {@link LisPangeneLookupElement | `LisPangeneLookupElement`} template.
 */
export type PangeneLookupFormData = {
  genuses: {
    genus: string;
    species: {
      species: string;
      strains: {
        strain: string;
        assemblies: {
          assembly: string;
          annotations: {
            annotation: string;
          }[];
        }[];
      }[];
    }[];
  }[];
};

/**
 * Optional parameters that may be given to a form data function. The
 * {@link !AbortSignal | `AbortSignal`} instance will emit if a new function is provided
 * before the current function completes. This signal should be used to cancel in-flight
 * requests if the external API supports it.
 */
export type PangeneFormDataOptions = {abortSignal?: AbortSignal};

/**
 * The type signature of a function that may be used to load the data used to construct
 * the lookup form in the {@link LisPangeneLookupElement | `LisPangeneLookupElement`} template.
 */
export type PangeneFormDataFunction = (
  options: PangeneFormDataOptions,
) => Promise<PangeneLookupFormData>;

/**
 * The data that will be passed to the lookup function by the
 * {@link LisPangeneLookupElement | `LisPangeneLookupElement`} class when a lookup is
 * performed.
 */
export type PangeneLookupData = {
  genus: string;
  species: string;
  strain: string;
  assembly: string;
  annotation: string;
  genes: string[];
} & PaginatedSearchData;

/**
 * A single result of a pangene lookup performed by the
 * {@link LisPangeneLookupElement | `LisPangeneLookupElement`} class.
 */
export type PangeneLookupResult = {
  input: string;
  panGeneSet: string;
  target: string;
};

/**
 * The signature of the function the
 * {@link LisPangeneLookupElement | `LisPangeneLookupElement`} class requires for
 * performing a pangene lookup.
 *
 * @param lookupData An object containing a value of each field in the submitted form.
 * @param page What page of results the lookup is for. Will always be 1 when a
 * new lookup is performed.
 * @param options Optional parameters that aren't required to perform a pangene
 * lookup but may be useful.
 *
 * @returns A {@link !Promise | `Promise`} that resolves to an
 * {@link !Array | `Array`} of {@link PangeneLookupResult | `PangeneLookupResult`}
 * objects.
 */
export type PangeneSearchFunction = (
  searchData: PangeneLookupData,
  options: SearchOptions,
) => Promise<Array<PangeneLookupResult>>;

export type PangeneDownloadFunction = DownloadFunction<PangeneLookupData>;

/**
 * @htmlElement `<lis-pangene-lookup-element>`
 *
 * A Web Component that provides an interface for looking up pangenes and
 * displaying results in a view table. Note that the component saves its state to the
 * URL query string parameters and a lookup will be automatically performed if the
 * parameters are present when the componnent is loaded. The component uses the
 * {@link mixins!LisPaginatedSearchMixin | `LisPaginatedSearchMixin`} mixin. See the
 * mixin docs for further details.
 *
 * @queryStringParameters
 * - **genus:** The selected genus in the lookup form.
 * - **species:** The selected species in the lookup form.
 * - **strain:** The selected strain in the lookup form.
 * - **assembly:** The selected assembly in the lookup form.
 * - **annotation:** The selected annotation in the lookup form.
 * - **identifier:** The identifier provided in the lookup form.
 * - **description:** The description provided in the lookup form.
 * - **family:** The gene family identifier provided in the lookup form.
 * - **page:** What page of results to load.
 *
 * @example
 * {@link !HTMLElement | `HTMLElement`} properties can only be set via
 * JavaScript. This means the {@link searchFunction | `searchFunction`} property
 * must be set on a `<lis-pangene-lookup-element>` tag's instance of the
 * {@link LisPangeneLookupElement | `LisPangeneLookupElement`} class. For example:
 * ```html
 * <!-- add the Web Component to your HTML -->
 * <lis-pangene-lookup-element id="pangene-lookup"></lis-pangene-lookup-element>
 *
 * <!-- configure the Web Component via JavaScript -->
 * <script type="text/javascript">
 *   // a site-specific function that sends a request to a pangene lookup API
 *   function getPangenes(lookupData, page, {abortSignal}) {
 *     // returns a Promise that resolves to a lookup result object
 *   }
 *   // get the pangene lookup element
 *   const lookupElement = document.getElementById('pangene-lookup');
 *   // set the element's searchFunction property
 *   lookupElement.searchFunction = getPangenes;
 * </script>
 * ```
 *
 * @example
 * Data must be provided for the genus, species, strain, assembly, and annotation selectors in the
 * lookup form. This can be done by setting the form's {@link formData | `formData`}
 * attribute/property directly or by setting the
 * {@link formDataFunction | `formDataFunction`} property. Setting the latter will call
 * the function immediately and set the {@link formData | `formData`} value using the
 * result. For example:
 * ```html
 * <!-- add the Web Component to your HTML -->
 * <lis-pangene-lookup-element id="pangene-lookup"></lis-pangene-lookup-element>
 *
 * <!-- configure the Web Component via JavaScript -->
 * <script type="text/javascript">
 *   // a site-specific function that gets genus, species, strain, assembly, and annotation data from an API
 *   function getPangeneFormData() {
 *     // returns a Promise that resolves to a form data object
 *   }
 *   // get the pangene looktup element
 *   const lookupElement = document.getElementById('pangene-lookup');
 *   // set the element's formDataFunction property
 *   lookupElement.formDataFunction = getPangeneFormData;
 * </script>
 * ```
 *
 * @example
 * The {@link genus | `genus`}, {@link species | `species`}, {@link strain | `strain`},
 * {@link assembly | `assembly`}, and {@link annotation | `annotation`} properties can be used to
 * limit all lookups to a specific genus, species, strain, assembly, and annotation. This will cause
 * the genus, species, strain, assembly, and annotation fields of the lookup form to be
 * automatically set and disabled so that users cannot change them. Additionally, these properties
 * cannot be overridden using the `genus`, `species`, `strain`, `assembly`, and `annotation`
 * querystring parameters. However, like the `genus`, `species`, `strain`, `assembly`, and
 * `annotation` querystring parameters, if the genus/species/strain/assembly/annotation set are not
 * present in the `formData` then the genus/species/strain/assembly/annotation form field will be
 * set to the default `any` value.
 * For example:
 * ```html
 * <!-- restrict the genus via HTML -->
 * <lis-pangene-lookup-element genus="Glycine"></lis-pangene-lookup-element>
 *
 * <!-- restrict the genus and species via HTML -->
 * <lis-pangene-lookup-element genus="Glycine" species="max"></lis-pangene-lookup-element>
 *
 * <!-- restrict the genus and species via JavaScript -->
 * <lis-pangene-lookup-element id="pangene-lookup"></lis-pangene-lookup-element>
 *
 * <script type="text/javascript">
 *   // get the pangene lookup element
 *   const lookupElement = document.getElementById('pangene-lookup');
 *   // set the element's genus and species properties
 *   lookupElement.genus = "Cicer";
 *   lookupElement.species = "arietinum";
 * </script>
 * ```
 *
 * @example
 * The {@link genesExample | `genesExample`} property can be used to set the example text for the
 * gene identifiers input field. For example:
 * ```html
 * <!-- set the example text via HTML -->
 * <lis-pangene-lookup-element genesExample="Glyma.13G357700 Glyma.13G357702"></lis-pangene-lookup-element>
 *
 * <!-- set the example text via JavaScript -->
 * <lis-pangene-lookup-element id="pangene-lookup"></lis-pangene-lookup-element>
 *
 * <script type="text/javascript">
 *   // get the pangene lookup element
 *   const lookupElement = document.getElementById('pangene-lookup');
 *   // set the element's example text properties
 *   lookupElement.genesExample = 'Glyma.13G357700 Glyma.13G357702';
 * </script>
 * ```
 */
@customElement('lis-pangene-lookup-element')
export class LisPangeneLookupElement extends LisPaginatedSearchMixin(
  LitElement,
)<PangeneLookupData, PangeneLookupResult>() {
  /** @ignore */
  // used by Lit to style the Shadow DOM
  // not necessary but exclusion breaks TypeDoc
  static override styles = css``;

  /**
   * The data used to construct the lookup form in the template.
   *
   * @attribute
   */
  @property()
  formData: PangeneLookupFormData = {genuses: []};

  /**
   * An optional property that can be used to load the form data via an external function.
   * If used, the `formData` attribute/property will be updated using the result.
   */
  @property({type: Function, attribute: false})
  formDataFunction: PangeneFormDataFunction = () =>
    Promise.reject(new Error('No form data function provided'));

  /**
   * An optional property that limits lookups to a specific genus. Setting the property to the
   * empty string "" will cause the genus form field to be set to the default "any" value.
   *
   * @attribute
   */
  @property({type: String})
  genus?: string;

  /**
   * An optional property that limits lookups to a specific species. Setting the property to the
   * empty string "" will cause the species form field to be set to the default "any" value. Doesn't
   * work without the `genus` property.
   *
   * @attribute
   */
  @property({type: String})
  species?: string;

  /**
   * An optional property that limits lookups to a specific strain. Setting the property to the
   * empty string "" will cause the strain form field to be set to the default "any" value. Doesn't
   * work without the `species` property.
   *
   * @attribute
   */
  @property({type: String})
  strain?: string;

  /**
   * An optional property that limits lookups to a specific assembly. Setting the property to the
   * empty string "" will cause the assembly form field to be set to the default "any" value.
   * Doesn't work without the `strain` property.
   *
   * @attribute
   */
  @property({type: String})
  assembly?: string;

  /**
   * An optional property that limits lookups to a specific annotation. Setting the property to the
   * empty string "" will cause the annotation form field to be set to the default "any" value.
   * Doesn't work without the `assembly` property.
   *
   * @attribute
   */
  @property({type: String})
  annotation?: string;

  /**
   * An optional property to set the example text for the Gene Identifiers input field.
   *
   * @attribute
   */
  @property({type: String})
  genesExample?: string;

  /**
   * What regular experssion should be used to parse the input gene identifiers.
   *
   * @attribute
   */
  @property({type: RegExp})
  genesRegexp: RegExp = /\s+/;

  /**
   * The maximum number of input gene identifiers.
   * Warning: setting this number too high can cause queries to hit web browsers' URL size limit.
   *
   * @attribute
   */
  @property({type: Number})
  genesLimit: number = 100;

  // the selected index of the genus select element
  @state()
  private selectedGenus: number = 0;

  // the selected index of the species select element
  @state()
  private selectedSpecies: number = 0;

  // the selected index of the strain select element
  @state()
  private selectedStrain: number = 0;

  // the selected index of the assembly select element
  @state()
  private selectedAssembly: number = 0;

  // the selected index of the annotation select element
  @state()
  private selectedAnnotation: number = 0;

  // a controller that allows in-flight form data requests to be cancelled
  protected formDataCancelPromiseController = new LisCancelPromiseController(
    this,
  );

  private _splitGenesFunctionWrapper(
    fn: PangeneSearchFunction | PangeneDownloadFunction,
  ) {
    return (data: PangeneLookupData, options: SearchOptions) => {
      // @ts-expect-error Property 'trim' does not exist on type 'string[]'
      data['genes'] = data['genes'].trim().split(this.genesRegexp);
      return fn(data, options);
    };
  }

  override willUpdate(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('searchFunction')) {
      // @ts-expect-error incompatible types
      this.searchFunction = this._splitGenesFunctionWrapper(
        this.searchFunction,
      );
    }
    if (
      changedProperties.has('downloadFunction') &&
      this.downloadFunction !== undefined
    ) {
      // @ts-expect-error incompatible types
      this.downloadFunction = this._splitGenesFunctionWrapper(
        this.downloadFunction,
      );
    }
  }

  // bind to the loading element in the template
  private _formLoadingRef: Ref<LisLoadingElement> = createRef();

  constructor() {
    super();
    // configure query string parameters
    this.requiredQueryStringParams = [
      ['genes', 'genus'],
      ['genes', 'genus', 'species'],
      ['genes', 'genus', 'species', 'strain'],
      ['genes', 'genus', 'species', 'strain', 'assembly'],
      ['genes', 'genus', 'species', 'strain', 'assembly', 'annotation'],
    ];
    this.resultAttributes = ['input', 'panGeneSet', 'target'];
    this.tableHeader = {
      input: 'Input',
      panGeneSet: 'PanGene Set',
      target: 'Target',
    };
    this.tableColumnClasses = {
      description: 'uk-table-expand',
    };
  }

  private _getDefaultGenus(): string {
    return this.valueOrQuerystringParameter(this.genus, 'genus');
  }

  private _getDefaultSpecies(): string {
    return this.valueOrQuerystringParameter(this.species, 'species');
  }

  private _getDefaultStrain(): string {
    return this.valueOrQuerystringParameter(this.strain, 'strain');
  }

  private _getDefaultAssembly(): string {
    return this.valueOrQuerystringParameter(this.assembly, 'assembly');
  }

  private _getDefaultAnnotation(): string {
    return this.valueOrQuerystringParameter(this.annotation, 'annotation');
  }

  // called when the component is added to the DOM; attributes should have properties now
  override connectedCallback() {
    super.connectedCallback();
    // initialize the form data with querystring parameters so a lookup can be performed
    // before the actual form data is loaded
    const formData: PangeneLookupFormData = {genuses: []};
    const genus = this._getDefaultGenus();
    if (genus) {
      const genusData = {genus, species: []} as (typeof formData.genuses)[0];
      formData.genuses.push(genusData);
      const species = this._getDefaultSpecies();
      if (species) {
        const speciesData = {
          species,
          strains: [],
        } as (typeof genusData.species)[0];
        genusData.species.push(speciesData);
        const strain = this._getDefaultStrain();
        if (strain) {
          const strainData = {
            strain,
            assemblies: [],
          } as (typeof speciesData.strains)[0];
          speciesData.strains.push(strainData);
          const assembly = this._getDefaultAssembly();
          if (assembly) {
            const assemblyData = {
              assembly,
              annotations: [],
            } as (typeof strainData.assemblies)[0];
            strainData.assemblies.push(assemblyData);
            const annotation = this._getDefaultAnnotation();
            if (annotation) {
              const annotationData = {
                annotation,
                annotations: [],
              } as (typeof assemblyData.annotations)[0];
              assemblyData.annotations.push(annotationData);
            }
          }
        }
      }
    }
    this.formData = formData;
    // set the selector values before the DOM is updated when the querystring parameters change
    this.queryStringController.addPreUpdateListener((_) => {
      this._initializeSelections();
    });
  }

  // called after every component update, e.g. when a property changes
  override updated(changedProperties: Map<string, unknown>) {
    // call the formDataFunction every time its value changes
    if (changedProperties.has('formDataFunction')) {
      this._getFormData();
    }
    // use querystring parameters to update the selectors when the form data changes
    if (
      changedProperties.has('formData') ||
      changedProperties.has('genus') ||
      changedProperties.has('species') ||
      changedProperties.has('strain') ||
      changedProperties.has('assembly') ||
      changedProperties.has('annotation')
    ) {
      this._initializeSelections();
    }
  }

  // gets the data for the lookup form
  private _getFormData() {
    // update the loading element
    this._formLoadingRef.value?.loading();
    // make the form data function cancellable
    this.formDataCancelPromiseController.cancel();
    const options = {
      abortSignal: this.formDataCancelPromiseController.abortSignal,
    };
    const formDataPromise = this.formDataFunction(options);
    // call the cancellable function
    this.formDataCancelPromiseController.wrapPromise(formDataPromise).then(
      (formData) => {
        this._formLoadingRef.value?.success();
        this.formData = formData;
      },
      (error: Error | Event) => {
        // do nothing if the request was aborted
        if (!(error instanceof Event && error.type === 'abort')) {
          this._formLoadingRef.value?.failure();
          throw error;
        }
      },
    );
  }

  // sets the selected indexes based on properties and querystring parameters
  private async _initializeSelections() {
    const genus = this._getDefaultGenus();
    if (genus) {
      this.selectedGenus =
        this.formData.genuses.map(({genus}) => genus).indexOf(genus) + 1;
    } else {
      this.selectedGenus = 0;
    }

    await this.updateComplete;

    const species = this._getDefaultSpecies();
    if (this.selectedGenus && species) {
      this.selectedSpecies =
        this.formData.genuses[this.selectedGenus - 1].species
          .map(({species}) => species)
          .indexOf(species) + 1;
    } else {
      this.selectedSpecies = 0;
    }

    await this.updateComplete;

    const strain = this._getDefaultStrain();
    if (this.selectedSpecies && strain) {
      this.selectedStrain =
        this.formData.genuses[this.selectedGenus - 1].species[
          this.selectedSpecies - 1
        ].strains
          .map(({strain}) => strain)
          .indexOf(strain) + 1;
    } else {
      this.selectedStrain = 0;
    }

    await this.updateComplete;

    const assembly = this._getDefaultAssembly();
    if (this.selectedStrain && assembly) {
      this.selectedAssembly =
        this.formData.genuses[this.selectedGenus - 1].species[
          this.selectedSpecies - 1
        ].strains[this.selectedStrain - 1].assemblies
          .map(({assembly}) => assembly)
          .indexOf(assembly) + 1;
    } else {
      this.selectedAssembly = 0;
    }

    await this.updateComplete;

    const annotation = this._getDefaultAnnotation();
    if (this.selectedAssembly && annotation) {
      this.selectedAnnotation =
        this.formData.genuses[this.selectedGenus - 1].species[
          this.selectedSpecies - 1
        ].strains[this.selectedStrain - 1].assemblies[
          this.selectedAssembly - 1
        ].annotations
          .map(({annotation}) => annotation)
          .indexOf(annotation) + 1;
    } else {
      this.selectedAnnotation = 0;
    }
  }

  // called when a genus is selected
  private _selectGenus(event: Event) {
    if (event.target != null) {
      this.selectedGenus = (event.target as HTMLSelectElement).selectedIndex;
      this.selectedSpecies = 0;
      this.selectedStrain = 0;
      this.selectedAssembly = 0;
      this.selectedAnnotation = 0;
    }
  }

  // renders the genus selector
  private _renderGenusSelector() {
    const options = this.formData.genuses.map(({genus}) => {
      return html`<option value="${genus}">${genus}</option>`;
    });
    // HACK: the disabled attribute can't be set via template literal...
    if (this.genus !== undefined) {
      const value = this.selectedGenus
        ? this.formData.genuses[this.selectedGenus - 1].genus
        : '';
      return html`
        <select
          required
          class="uk-select uk-form-small"
          disabled
          .selectedIndex=${live(this.selectedGenus)}
          @change="${this._selectGenus}"
        >
          <option value="">-- select one --</option>
          ${options}
        </select>
        <input type="hidden" name="genus" value="${value}" />
      `;
    }
    return html`
      <select
        required
        class="uk-select uk-form-small"
        name="genus"
        .selectedIndex=${live(this.selectedGenus)}
        @change="${this._selectGenus}"
      >
        <option value="">-- select one --</option>
        ${options}
      </select>
    `;
  }

  // called when a species is selected
  private _selectSpecies(event: Event) {
    if (event.target != null) {
      this.selectedSpecies = (event.target as HTMLSelectElement).selectedIndex;
      this.selectedStrain = 0;
      this.selectedAssembly = 0;
      this.selectedAnnotation = 0;
    }
  }

  // renders the species selector
  private _renderSpeciesSelector() {
    let options = [html``];
    if (this.selectedGenus) {
      options = this.formData.genuses[this.selectedGenus - 1].species.map(
        ({species}) => {
          return html`<option value="${species}">${species}</option>`;
        },
      );
    }
    // HACK: the disabled attribute can't be set via template literal...
    if (this.genus !== undefined && this.species !== undefined) {
      const value =
        this.selectedGenus && this.selectedSpecies
          ? this.formData.genuses[this.selectedGenus - 1].species[
              this.selectedSpecies - 1
            ].species
          : '';
      return html`
        <select
          class="uk-select uk-form-small"
          disabled
          .selectedIndex=${live(this.selectedSpecies)}
          @change="${this._selectSpecies}"
        >
          <option value="">-- any --</option>
          ${options}
        </select>
        <input type="hidden" name="species" value="${value}" />
      `;
    }
    return html`
      <select
        class="uk-select uk-form-small"
        name="species"
        .selectedIndex=${live(this.selectedSpecies)}
        @change="${this._selectSpecies}"
      >
        <option value="">-- any --</option>
        ${options}
      </select>
    `;
  }

  // called when an strain is selected
  private _selectStrain(event: Event) {
    if (event.target != null) {
      this.selectedStrain = (event.target as HTMLSelectElement).selectedIndex;
    }
  }

  // renders the strain selector
  private _renderStrainSelector() {
    let options = [html``];
    if (this.selectedGenus && this.selectedSpecies) {
      options = this.formData.genuses[this.selectedGenus - 1].species[
        this.selectedSpecies - 1
      ].strains.map(({strain}) => {
        return html`<option value="${strain}">${strain}</option>`;
      });
    }
    // HACK: the disabled attribute can't be set via template literal...
    if (
      this.genus !== undefined &&
      this.species !== undefined &&
      this.strain !== undefined
    ) {
      const value =
        this.selectedGenus && this.selectedSpecies && this.selectedStrain
          ? this.formData.genuses[this.selectedGenus - 1].species[
              this.selectedSpecies - 1
            ].strains
          : '';
      return html`
        <select
          class="uk-select uk-form-small"
          disabled
          .selectedIndex=${live(this.selectedStrain)}
          @change="${this._selectStrain}"
        >
          <option value="">-- any --</option>
          ${options}
        </select>
        <input type="hidden" name="strain" value="${value}" />
      `;
    }
    return html`
      <select
        class="uk-select uk-form-small"
        name="strain"
        .selectedIndex=${live(this.selectedStrain)}
        @change="${this._selectStrain}"
      >
        <option value="">-- any --</option>
        ${options}
      </select>
    `;
  }

  // called when an assembly is selected
  private _selectAssembly(event: Event) {
    if (event.target != null) {
      this.selectedAssembly = (event.target as HTMLSelectElement).selectedIndex;
      this.selectedAnnotation = 0;
    }
  }

  // renders the assembly selector
  private _renderAssemblySelector() {
    let options = [html``];
    if (this.selectedGenus && this.selectedSpecies && this.selectedStrain) {
      options = this.formData.genuses[this.selectedGenus - 1].species[
        this.selectedSpecies - 1
      ].strains[this.selectedStrain - 1].assemblies.map(({assembly}) => {
        return html`<option value="${assembly}">${assembly}</option>`;
      });
    }
    // HACK: the disabled attribute can't be set via template literal...
    if (
      this.genus !== undefined &&
      this.species !== undefined &&
      this.strain !== undefined &&
      this.assembly !== undefined
    ) {
      const value =
        this.selectedGenus &&
        this.selectedSpecies &&
        this.selectedStrain &&
        this.selectedAssembly
          ? this.formData.genuses[this.selectedGenus - 1].species[
              this.selectedSpecies - 1
            ].strains[this.selectedStrain - 1].assemblies
          : '';
      return html`
        <select
          class="uk-select uk-form-small"
          disabled
          .selectedIndex=${live(this.selectedAssembly)}
          @change="${this._selectAssembly}"
        >
          <option value="">-- any --</option>
          ${options}
        </select>
        <input type="hidden" name="assembly" value="${value}" />
      `;
    }
    return html`
      <select
        class="uk-select uk-form-small"
        name="assembly"
        .selectedIndex=${live(this.selectedAssembly)}
        @change="${this._selectAssembly}"
      >
        <option value="">-- any --</option>
        ${options}
      </select>
    `;
  }

  // called when an annotation is selected
  private _selectAnnotation(event: Event) {
    if (event.target != null) {
      this.selectedAnnotation = (
        event.target as HTMLSelectElement
      ).selectedIndex;
    }
  }

  // renders the annotation selector
  private _renderAnnotationSelector() {
    let options = [html``];
    if (
      this.selectedGenus &&
      this.selectedSpecies &&
      this.selectedStrain &&
      this.selectedAssembly
    ) {
      options = this.formData.genuses[this.selectedGenus - 1].species[
        this.selectedSpecies - 1
      ].strains[this.selectedStrain - 1].assemblies[
        this.selectedAssembly - 1
      ].annotations.map(({annotation}) => {
        return html`<option value="${annotation}">${annotation}</option>`;
      });
    }
    // HACK: the disabled attribute can't be set via template literal...
    if (
      this.genus !== undefined &&
      this.species !== undefined &&
      this.strain !== undefined &&
      this.assembly !== undefined &&
      this.annotation !== undefined
    ) {
      const value =
        this.selectedGenus &&
        this.selectedSpecies &&
        this.selectedStrain &&
        this.selectedAssembly &&
        this.selectedAnnotation
          ? this.formData.genuses[this.selectedGenus - 1].species[
              this.selectedSpecies - 1
            ].strains[this.selectedStrain - 1].assemblies[
              this.selectedAssembly - 1
            ].annotations
          : '';
      return html`
        <select
          class="uk-select uk-form-small"
          disabled
          .selectedIndex=${live(this.selectedAnnotation)}
          @change="${this._selectAnnotation}"
        >
          <option value="">-- any --</option>
          ${options}
        </select>
        <input type="hidden" name="annotation" value="${value}" />
      `;
    }
    return html`
      <select
        class="uk-select uk-form-small"
        name="annotation"
        .selectedIndex=${live(this.selectedAnnotation)}
        @change="${this._selectAnnotation}"
      >
        <option value="">-- any --</option>
        ${options}
      </select>
    `;
  }

  // called when the form is submitted to run custom field validation
  private _validateForm(e: SubmitEvent) {
    const formElement = e.target as HTMLFormElement;
    if (formElement == null) return;
    // check genes textarea validity
    const genesElement = formElement.genes;
    const identifiers = genesElement.value.trim().split(this.genesRegexp);
    let genesValidity = '';
    if (identifiers.length > this.genesLimit) {
      genesValidity = `No more than ${this.genesLimit} gene identifiers allowed.`;
    }
    genesElement.setCustomValidity(genesValidity);
    // check form validity; will catch standard and custom invalid fields
    if (!formElement.checkValidity()) {
      e.preventDefault();
      e.stopPropagation();
      formElement.reportValidity();
    }
  }

  /** @ignore */
  // used by LisPaginatedSearchMixin to draw the lookup form part of template
  override renderForm() {
    // render the form's selectors
    const genusSelector = this._renderGenusSelector();
    const speciesSelector = this._renderSpeciesSelector();
    const strainSelector = this._renderStrainSelector();
    const assemblySelector = this._renderAssemblySelector();
    const annotationSelector = this._renderAnnotationSelector();
    // render the optional download button
    let downloadButton = html``;
    if (this.downloadFunction !== undefined) {
      downloadButton = html`
        <button
          type="submit"
          value="download"
          class="uk-button uk-button-default"
        >
          Download
        </button>
        <lis-inline-loading-element
          ${ref(this._downloadingRef)}
        ></lis-inline-loading-element>
      `;
    }

    // render the form
    return html`
      <form class="uk-form-stacked" novalidate @submit="${this._validateForm}">
        <fieldset class="uk-fieldset">
          <legend class="uk-legend">Pangene Lookup</legend>
          <lis-loading-element
            ${ref(this._formLoadingRef)}
          ></lis-loading-element>
          <div class="uk-margin uk-grid-small" uk-grid>
            <div class="uk-width-1-1@s">
              <label class="uk-form-label" for="identifier"
                >Gene Identifiers</label
              >
              <textarea
                required
                class="uk-textarea"
                rows="5"
                name="genes"
                .value=${this.queryStringController.getParameter('genes')}
              ></textarea>
              <lis-form-input-example-element
                .text=${this.genesExample}
              ></lis-form-input-example-element>
            </div>
          </div>
          <label class="uk-form-label"
            >Constraints target pangenes must satisfy</label
          >
          <div class="uk-margin uk-grid-small" uk-grid>
            <div class="uk-width-1-3@s">
              <label class="uk-form-label" for="genus">Genus</label>
              ${genusSelector}
            </div>
            <div class="uk-width-1-3@s">
              <label class="uk-form-label" for="species">Species</label>
              ${speciesSelector}
            </div>
            <div class="uk-width-1-3@s">
              <label class="uk-form-label" for="strain">Strain</label>
              ${strainSelector}
            </div>
          </div>
          <div class="uk-margin uk-grid-small" uk-grid>
            <div class="uk-width-1-3@s">
              <label class="uk-form-label" for="assembly">Assembly</label>
              ${assemblySelector}
            </div>
            <div class="uk-width-1-3@s">
              <label class="uk-form-label" for="annotation">Annotation</label>
              ${annotationSelector}
            </div>
          </div>
          <div class="uk-margin">
            <button type="submit" class="uk-button uk-button-primary">
              Lookup
            </button>
            ${downloadButton}
          </div>
        </fieldset>
      </form>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lis-pangene-lookup-element': LisPangeneLookupElement;
  }
}
