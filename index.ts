// @ts-ignore
import { random, sample, round } from "lodash";
const { green, red } = require("chalk");

enum DangerousGeneStrategyType {
  dominant,
  recessive
}

enum FitnessStrategyType{
  dangerousGene,
  MaxSum
}

const GENOME_LENGTH = 100;
const GENOME_VARIANTS = 1;
const DANGEROUS_GENE = [GENOME_VARIANTS - 1, GENOME_VARIANTS - 1];
const CYCLES = 1000   ;
const INITIAL_POPULATION = 50000;
const MUTATION_PROBABILITY_PER_GEN = 0.00001;
const FITNESS_STRATEGY: FitnessStrategyType =FitnessStrategyType.dangerousGene
const DANGEROUS_GENE_FENOTYPE: DangerousGeneStrategyType = DangerousGeneStrategyType.recessive

class Organism {
  genomeLength: number;
  genome: number[][];
  fitness: number;
  sex: "male" | "female";
  constructor(parent1?: Organism, parent2?: Organism, sex?: "male" | "female") {
    this.genomeLength = GENOME_LENGTH;
    this.sex = sex || sample(["male", "female", "male", "female"]);
    if (parent1 && parent2) {
      this.calculateGenome(parent1, parent2);
    } else {
      this.genome = this.generateRandomGenome();
    }
    this.calculateFitness();
    // console.log('GENOME', this.genome)
    // console.log('FITNESS', this.fitness)
  }

  generateRandomGenome() {
    return new Array(this.genomeLength).fill([0, 0]).map(this.getRandomGene);
  }

  getRandomGene() {
    return [
      random(0, GENOME_VARIANTS, false),
      random(0, GENOME_VARIANTS, false),
    ];
  }

  calculateGenome(parent1: Organism, parent2: Organism) {
    this.genome = new Array(this.genomeLength)
      .fill([0, 0])
      .map((v, index) => {
        if (Math.random() < MUTATION_PROBABILITY_PER_GEN){
          return this.getRandomGene()
        }
        return[
          sample(parent1.genome[index]),
          sample(parent2.genome[index]),
        ]
      })
  }

  calculateFitness() {
    if (FITNESS_STRATEGY === FitnessStrategyType.dangerousGene){
      return this.calculateDangerousGeneFitness()
    } else if (FITNESS_STRATEGY ===FitnessStrategyType.MaxSum){
      return this.calculateMaxSumFitness()
    }
  }

  calculateDangerousGeneFitness(){
    this.fitness = this.genome.reduce((prevFitness, gen) => {
      if (this.isBadGene(gen)) {
        return prevFitness;
      }
      return prevFitness + 1;
    }, 0);
  }

  calculateMaxSumFitness(){
    this.fitness = this.genome.reduce((prevFitness, gen) => {
      return prevFitness + Math.max(...gen);
    }, 0);
  }

  isBadGene(gen){
    if (DANGEROUS_GENE_FENOTYPE === DangerousGeneStrategyType.recessive){
      return gen[0] === DANGEROUS_GENE[0] && gen[1] === DANGEROUS_GENE[1]
    } else if (DANGEROUS_GENE_FENOTYPE ===DangerousGeneStrategyType.dominant){
      return gen[0] === DANGEROUS_GENE[0] && gen[1] === DANGEROUS_GENE[0]
    }
  }
}

class Population {
  initialPopulation: number;
  maleProbability: number;
  fitness: number;
  population: Organism[];
  males: Organism[];
  females: Organism[];
  constructor(maleProbability = 0.5, initialPopulation = INITIAL_POPULATION) {
    this.initialPopulation = initialPopulation;
    this.maleProbability = maleProbability;
    this.generateInitialPopulation();
    this.calculateStats();
  }

  generateInitialPopulation() {
    this.population = new Array(this.initialPopulation)
      .fill(0)
      .map(() => new Organism());
  }

  calculateStats() {
    this.males = this.getMales();
    this.females = this.getFemales();
    this.fitness = this.getTotalFitness();
  }

  getMales() {
    return this.population.filter((org) => org.sex === "male");
  }

  getFemales() {
    return this.population.filter((org) => org.sex === "female");
  }

  getSex() {
    if (Math.random() <= this.maleProbability) {
      return "male";
    } else {
      return "female";
    }
  }

  getTotalFitness(): number {
    return  round(this.population.reduce(
      (prevFitness, organism) => organism.fitness + prevFitness,
      0
    )/ (INITIAL_POPULATION* GENOME_LENGTH)*100, 3);
  }

  getReproductionPopulation(organisms: Organism[]) {
    // return this.males;
   return organisms.reduce((prevPopulation: Organism[], org) => {
      prevPopulation.push(...new Array(org.fitness).fill(org));
      return prevPopulation;
    }, [] as Organism[])
  }

  reproduce() {
    const malesWeighted = this.getReproductionPopulation(this.males);
    const femalesWeighted = this.getReproductionPopulation(this.females);
    this.population = new Array(this.initialPopulation)
      .fill(0)
      .map((_, index) => {
        const parent1 = sample(femalesWeighted);
        const parent2 = sample(malesWeighted);
        // console.log( parent2.genome , parent1.genome)
        return new Organism(parent1, parent2, this.getSex());
      });
    this.calculateStats();
  }
}

class Model {
  static run() {
    const p1 = new Population(0.01);
    const p2 = new Population();

    let p1Wins = 0;
    let p2Wins = 0;
    let ties = 0;

    console.log("-------");
    for (let i = 0; i <= CYCLES; i++) {
      
      console.log(
        `p1F ${p1.fitness>p2.fitness? green(p1.fitness): red(p1.fitness)}`,
        `p2F ${p2.fitness>p1.fitness? green(p2.fitness): red(p2.fitness)}`,
        `p1: ${green(p1.males.length)}/${green(p1.females.length)}`,
        `p1: ${green(p2.males.length)}/${green(p2.females.length)}`,
        p1.fitness===p2.fitness? 'TIE':''
      );
      if (p1.fitness>p2.fitness){
        p1Wins+=1
      } else if (p1.fitness<p2.fitness){
        p2Wins +=1
      } else{
        ties+1;
      }
      p1.reproduce();
      p2.reproduce();

    }
    if (p1Wins>p2Wins){
      console.log('P1 WINS')
    }
    else if (p1Wins<p2Wins){
      console.log('P2 WINS')
    } else {
      console.log('TIE')
    }
  }
}

Model.run();
