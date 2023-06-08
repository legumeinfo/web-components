# Gene search query

This is the requirements doc for the LIS gene search to be implemented on the LIS Jekyll web site.

## Input

- genus (selector with "any" on top)
- species (selector populated if genus specified, otherwise only "any")
- strain (selector populated if species specified, otherwise only "any")
- gene identifier (text input)
- gene description (text input)
- gene family identifier (text input)
- search button

Examples are shown below each text input element. (Selectors are self-explanatory.)

### Mockup

![image](https://user-images.githubusercontent.com/5657219/231203688-f7493a37-f98a-42ef-a1f8-66b1395fbd76.png)

## Output

The output will be a paginated list of search results in *vertical display* form, containing:

- full LIS identifier (linked to Linkout Service) e.g. `aesev.CIAT22838.gnm1.ann1.Ae01g16390`
- gene name (typically originating from Name attribute in LIS GFF) e.g. `Ae01g16390`
- *genus species* strain
- gene description (typically originating from Note attribute in LIS GFF) e.g. `oxygen-evolving enhancer protein; IPR008797 (Photosystem II PsbQ, oxygen evolving ...`
- genomic location (chromosome:start-finish, strand) e.g. `aesev.CIAT22838.gnm1.Ae01:20407086-20408460 (+)`
- gene family identifier (linked to Linkout Service) e.g. `legfed_v1_0.L_KK1G2X`

### Mockup

![image](https://user-images.githubusercontent.com/5657219/231203947-54114753-ce84-467c-b150-8526c77355c7.png)

## Implementation notes

- the query will be a GraphQL query run by a web component, which in turn runs an InterMine path query against LegumeMine.
- the linkouts are not specified here -- those are the purview of the Linkout Service specification, which also specifies how they are implemented on web components like this.
