<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $sitemap->name }} - Crawler Report</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #334155;
            line-height: 1.5;
            margin: 0;
            padding: 0;
        }
        .header {
            background-color: #4f46e5;
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.025em;
        }
        .header p {
            margin: 10px 0 0;
            opacity: 0.8;
            font-size: 14px;
        }
        .summary {
            padding: 30px;
            background-color: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            display: table;
            width: 100%;
        }
        .summary-item {
            display: table-cell;
            text-align: center;
            width: 33%;
        }
        .summary-item label {
            display: block;
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
            margin-bottom: 5px;
        }
        .summary-item span {
            font-size: 18px;
            font-weight: 800;
            color: #1e293b;
        }
        .content {
            padding: 30px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th {
            background-color: #f1f5f9;
            text-align: left;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            color: #475569;
            padding: 12px 10px;
            border-bottom: 2px solid #e2e8f0;
        }
        td {
            padding: 12px 10px;
            font-size: 11px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
        }
        .status-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 9999px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
        }
        .status-completed { background-color: #dcfce7; color: #166534; }
        .status-crawling { background-color: #dbeafe; color: #1e40af; }
        .status-discovered { background-color: #fef9c3; color: #854d0e; }
        .status-error { background-color: #fee2e2; color: #991b1b; }
        
        .url { font-weight: 700; color: #4f46e5; word-break: break-all; }
        .title { color: #1e293b; margin-top: 4px; display: block; }
        .footer {
            padding: 30px;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
        }
    </Style>
</head>
<body>
    <div class="header">
        <h1>Sitemap Intelligence Report</h1>
        <p>{{ $sitemap->name }} ({{ $sitemap->filename }})</p>
    </div>

    <div class="summary">
        <div class="summary-item">
            <label>Total Links</label>
            <span>{{ count($links) }}</span>
        </div>
        <div class="summary-item">
            <label>Report Date</label>
            <span>{{ now()->format('M d, Y') }}</span>
        </div>
        <div class="summary-item">
            <label>Load Time Avg</label>
            <span>{{ number_format($links->avg('load_time'), 2) }}s</span>
        </div>
    </div>

    <div class="content">
        <table>
            <thead>
                <tr>
                    <th width="45%">Page Details</th>
                    <th width="15%">Status</th>
                    <th width="15%">Load Time</th>
                    <th width="25%">SEO Context</th>
                </tr>
            </thead>
            <tbody>
                @foreach($links as $link)
                <tr>
                    <td>
                        <div class="url">{{ $link->url }}</div>
                        <span class="title">{{ $link->title ?? 'No title detected' }}</span>
                    </td>
                    <td>
                        <span class="status-badge status-{{ $link->status }}">
                            {{ $link->status }}
                        </span>
                    </td>
                    <td>{{ number_format($link->load_time, 2) }}s</td>
                    <td>
                        @if($link->is_canonical)
                            <div style="color: #166534; font-weight: 700;">✓ Canonical</div>
                        @else
                            <div style="color: #991b1b; font-weight: 700;">⚠ Non-Canonical</div>
                        @endif
                        <div style="margin-top: 4px; color: #64748b;">
                            HTTP: <strong>{{ $link->http_status ?? 200 }}</strong>
                        </div>
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="footer">
        Generated by Metapilot Sitemap Intelligence Hub &bull; {{ now()->toDateTimeString() }}
    </div>
</body>
</html>
