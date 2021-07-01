import React from "react";
import ReactDOM from "react-dom";
import "./index.css";

class Main extends React.Component{
	constructor(props){
		super(props);
		let stockSymbols = [];
		
		if(document.cookie !== ""){
			stockSymbols = document.cookie.split(",");
		}
		else{
			stockSymbols = ["IBM", "AAPL", "MSFT", "INTC", "AMD"];
		};
		
		this.state = {
			tiles: [],
			stockSymbols: stockSymbols,
			fullList: [],
			addStockObj: <div className="addTile"><span onClick={() => this.addStock()}>(+)</span></div>,
			value: "",
		};
	}
	
	componentDidMount(){
		let tiles = this.state.tiles.slice();
		let stockSymbols = this.state.stockSymbols.slice();
		let symbolsString = stockSymbols.join();
			
		this.fetchFullList()
			.then(res => {
				let fullList = res.split("\r\n");
				
				this.setState({
					fullList: fullList,
				});
			})
			.catch((error) => {
				console.error(error.message);
			})
		
		this.fetchStockData(symbolsString)
			.then((stockData) => {
				for(let i = 0; i < stockSymbols.length; i++){
					tiles.push(new Array(
						stockSymbols[i],													//Stock Symbol
						stockData[stockSymbols[i]].quote.change.toFixed(2),					//Numerical Change
						stockData[stockSymbols[i]].quote.changePercent.toFixed(2),			//Percent Change
						stockData[stockSymbols[i]].quote.latestPrice.toFixed(2),			//Current Price
					));
				};
				this.setState({
					tiles: tiles,
				});
			})
			.catch((error) => {
				console.error(error.message);
			})

		this.interval = setInterval(() => {
			let tiles = this.state.tiles.slice();
			let stockSymbols = this.state.stockSymbols.slice();
			let symbolsString = stockSymbols.join();
			
			this.fetchStockData(symbolsString)
				.then((stockData) => {
					for(let i = 0; i < stockSymbols.length; i++){
						tiles[i][1] = stockData[stockSymbols[i]].quote.change.toFixed(2);				//Numerical Change
						tiles[i][2] = stockData[stockSymbols[i]].quote.changePercent.toFixed(2);		//Percent Change
						tiles[i][3] = stockData[stockSymbols[i]].quote.latestPrice.toFixed(2);			//Current Price
					};
					this.setState({
						tiles: tiles,
					});
				})
				.catch((error) => {
					console.error(error);
				})
		}, 3000);
	}
	
	componentWillUnmount(){
		clearInterval(this.interval);
	}
	
	async fetchFullList(){
		const response = await fetch("list.txt");
		
		if(!response.ok){
			const message = "An error has occured.";
			throw new Error(message);
		}
		
		const fullList = await response.text();
		return fullList;
	};
	
	async fetchStockData(symbolsString){
		const { REACT_APP_APIKEY } = process.env;
		const response = await fetch("https://cloud.iexapis.com/stable/stock/market/batch?types=quote&symbols=" + symbolsString + "&token=" + process.env.REACT_APP_APIKEY);
		
		if(!response.ok){
			const message = "An error has occured.";
			throw new Error(message);
		}
		
		const stockData = await response.json();
		return stockData;
	};
	
	handleInput = (event) => {
		this.setState({
			value: event.target.value,
		});
	};
	
	addStock = (event, cancel) => {
		let entryMessage = "ENTER A SYMBOL ";
		const entry = this.state.value.toUpperCase();
		
		if(event == null){
			this.showStockEntry(entryMessage, false);
		}
		else if(cancel){
			this.setState({
				addStockObj: <div className="addTile"><span onClick={(e) => this.addStock(null, false)}>(+)</span></div>,
			});
		}
		else{
			event.preventDefault();
			let stockSymbols = this.state.stockSymbols.slice();
			
			if(this.state.fullList.includes(entry) === false){
				entryMessage = "INVALID SYMBOL ";
				this.showStockEntry(entryMessage, true);
			}
			else if(stockSymbols.includes(entry)){
				entryMessage = "DUPLICATE STOCK ";
				this.showStockEntry(entryMessage, true);
			}
			else{
				let stockSymbols = this.state.stockSymbols.slice();
				let tiles = this.state.tiles.slice();
				
				stockSymbols.push(entry);
				
				const lastLoc = stockSymbols.length - 1;
				tiles.push(new Array(
					stockSymbols[lastLoc],
					"--.--",
					"--.--",
					"--.--",
				));
			
				this.setState({
					stockSymbols: stockSymbols,
					tiles: tiles,
					addStockObj: <div className="addTile"><span onClick={(e) => this.addStock(null, false)}>(+)</span></div>,
				});
				
				document.cookie = stockSymbols.join();
			};
		};
		
		return;
	};
	
	showStockEntry = (entryMessage, invalid) => {
		let tileStyle = {color: "#1AF7C1", filter: "drop-shadow(0 0 5px #1AF7C1)"};
		let inputStyle = {color: "#1AF7C1", borderColor: "#1AF7C1"};
		if(invalid){
			tileStyle = {color: "red", filter: "drop-shadow(0 0 5px red)"};
			inputStyle = {color: "red", borderColor: "red"};
		};
		
		this.setState({
			addStockObj: 
				<form className="addTile" style={tileStyle} onSubmit={this.addStock}>
					<label>{entryMessage}
						<input type="text" style={inputStyle} size="7" onChange={this.handleInput} />
					</label>
					<input type="submit" style={inputStyle} value="(>)" />
					<span onClick={(e) => this.addStock(e, true)}>(x)</span>
				</form>,
		});
	};
	
	deleteStock = (stock) => {
		let tiles = this.state.tiles.slice();
		let stockSymbols = this.state.stockSymbols.slice();
		
		for(let i = 0; i < stockSymbols.length; i++){
			if(stockSymbols[i] === stock){
				tiles.splice(i, 1);
				stockSymbols.splice(i, 1);
			}
		}
		
		this.setState({
			tiles: tiles,
			stockSymbols: stockSymbols,
		});
		
		document.cookie = stockSymbols.join();
	}
	
	buildTiles = () => {
		let tileElements = [];
		let tiles = this.state.tiles.slice();
		
		for(let i = 0; i < tiles.length; i++){
			let pos = "";
			let tileStyle = {color: "red", filter: "drop-shadow(0 0 5px red)"};
			if(this.state.tiles[i][1] > 0){
				pos = "+";
				tileStyle = {color: "#1AF7C1", filter: "drop-shadow(0 0 5px #1AF7C1)"};
			}
			
			tileElements.push(
				<div className="tile" style={tileStyle}>
					<p className="tileText"><span>{this.state.tiles[i][0]}</span> <span>{this.state.tiles[i][3]}</span></p>
					<p className="tileText"><span>{pos}{this.state.tiles[i][1]}</span> <span>({pos}{this.state.tiles[i][2]}%)</span></p>
					<span className="deleteTile" onClick={() => this.deleteStock(this.state.tiles[i][0])}>(x)</span>
				</div>
			);
		};
		
		tileElements.push(
			this.state.addStockObj
		);
		
		return tileElements;
	};
	
	render(){
		return(
			<div>
				<img className="logo" src="./logo.svg" alt="StocksNow"></img>
				<div className="tileHolder">{this.buildTiles()}</div>
			</div>
		);
	}
}

ReactDOM.render(
	<Main />,
	document.getElementById("root")
);