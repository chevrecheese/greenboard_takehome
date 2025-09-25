import React, { useState } from "react";
import apiService from "../services/api";

const ArchiveForm = ({ onArchiveStarted, onError }) => {
	const [url, setUrl] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!url.trim()) {
			onError("Please enter a URL");
			return;
		}

		// Add protocol if missing
		let processedUrl = url.trim();
		if (
			!processedUrl.startsWith("http://") &&
			!processedUrl.startsWith("https://")
		) {
			processedUrl = "https://" + processedUrl;
		}

		// Validate URL
		if (!apiService.isValidUrl(processedUrl)) {
			onError("Please enter a valid URL");
			return;
		}

		setIsLoading(true);

		try {
			const job = await apiService.startArchiving(processedUrl);
			onArchiveStarted(job);
			setUrl(""); // Clear form on success
		} catch (error) {
			onError(error.message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='archive-form'>
			<div className='form-header'>
				<h2>🌐 Web Archiver</h2>
				<p>Enter a URL to create a snapshot of the website</p>
			</div>

			<form onSubmit={handleSubmit} className='url-form'>
				<div className='input-group'>
					<input
						type='text'
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						placeholder='Enter website URL (e.g., example.com)'
						className='url-input'
						disabled={isLoading}
					/>
					<button
						type='submit'
						className='archive-button'
						disabled={isLoading || !url.trim()}
					>
						{isLoading ? (
							<>
								<span className='spinner'></span>
								Archiving...
							</>
						) : (
							"📁 Archive Website"
						)}
					</button>
				</div>
			</form>

			<div className='form-info'>
				<h3>How it works:</h3>
				<ul>
					<li>🔍 Discovers all pages on the same domain</li>
					<li>💾 Downloads HTML, images, CSS, and JavaScript</li>
					<li>🕒 Creates timestamped snapshots for version history</li>
					<li>🔗 Preserves the original look and functionality</li>
				</ul>
			</div>

			<style jsx>{`
				.archive-form {
					max-width: 800px;
					margin: 0 auto;
					padding: 2rem;
					background: white;
					border-radius: 12px;
					box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
				}

				.form-header {
					text-align: center;
					margin-bottom: 2rem;
				}

				.form-header h2 {
					font-size: 2.5rem;
					margin: 0 0 0.5rem 0;
					color: #2c3e50;
				}

				.form-header p {
					color: #7f8c8d;
					font-size: 1.1rem;
					margin: 0;
				}

				.url-form {
					margin-bottom: 2rem;
				}

				.input-group {
					display: flex;
					gap: 1rem;
					align-items: stretch;
				}

				.url-input {
					flex: 1;
					padding: 1rem;
					font-size: 1rem;
					border: 2px solid #e0e0e0;
					border-radius: 8px;
					outline: none;
					transition: border-color 0.3s ease;
				}

				.url-input:focus {
					border-color: #3498db;
				}

				.url-input:disabled {
					background-color: #f8f9fa;
					color: #6c757d;
				}

				.archive-button {
					padding: 1rem 2rem;
					font-size: 1rem;
					font-weight: 600;
					background: linear-gradient(135deg, #3498db, #2980b9);
					color: white;
					border: none;
					border-radius: 8px;
					cursor: pointer;
					transition: all 0.3s ease;
					display: flex;
					align-items: center;
					gap: 0.5rem;
					white-space: nowrap;
				}

				.archive-button:hover:not(:disabled) {
					background: linear-gradient(135deg, #2980b9, #1f5f8b);
					transform: translateY(-2px);
					box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
				}

				.archive-button:disabled {
					background: #bdc3c7;
					cursor: not-allowed;
					transform: none;
					box-shadow: none;
				}

				.spinner {
					width: 16px;
					height: 16px;
					border: 2px solid transparent;
					border-top: 2px solid white;
					border-radius: 50%;
					animation: spin 1s linear infinite;
				}

				@keyframes spin {
					0% {
						transform: rotate(0deg);
					}
					100% {
						transform: rotate(360deg);
					}
				}

				.form-info {
					background: #f8f9fa;
					padding: 1.5rem;
					border-radius: 8px;
					border-left: 4px solid #3498db;
				}

				.form-info h3 {
					margin: 0 0 1rem 0;
					color: #2c3e50;
					font-size: 1.2rem;
				}

				.form-info ul {
					margin: 0;
					padding-left: 1.5rem;
					color: #5a6c7d;
				}

				.form-info li {
					margin-bottom: 0.5rem;
					line-height: 1.5;
				}

				@media (max-width: 768px) {
					.archive-form {
						margin: 1rem;
						padding: 1.5rem;
					}

					.input-group {
						flex-direction: column;
					}

					.form-header h2 {
						font-size: 2rem;
					}

					.archive-button {
						justify-content: center;
					}
				}
			`}</style>
		</div>
	);
};

export default ArchiveForm;
