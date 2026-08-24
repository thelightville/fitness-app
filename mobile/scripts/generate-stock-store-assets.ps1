<#
.SYNOPSIS
Regenerates Fitness PT Tracker store listing graphics from stock photography.

.DESCRIPTION
Creates Google Play feature graphics plus Play and iOS phone screenshots using the
stock fitness photos tracked under public/images. This keeps App Store and Play
Console visuals aligned with the real-photography direction used in the web and
native app surfaces.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$playDir = Join-Path $repoRoot 'mobile\store-assets\play'
$iosDir = Join-Path $repoRoot 'mobile\store-assets\ios\iphone_65'

$screens = @(
  @{
    Name = '01-login.png'
    Photo = 'stock-gym-equipment.jpg'
    Eyebrow = 'FITNESS PT TRACKER'
    Title = 'Sign in and see your day'
    Body = 'Secure mobile access for clients, trainers and admins.'
    Tag = 'Sign in'
  },
  @{
    Name = '02-trainer-dashboard.png'
    Photo = 'stock-gym-coaching.jpg'
    Eyebrow = 'TRAINER DASHBOARD'
    Title = 'Coach every session'
    Body = 'Upcoming bookings, client status and next actions stay close at hand.'
    Tag = 'Trainer flow'
  },
  @{
    Name = '03-appointments.png'
    Photo = 'stock-gym-equipment.jpg'
    Eyebrow = 'APPOINTMENTS'
    Title = 'Confirm, cancel and check in'
    Body = 'Manage session changes from the same mobile workflow.'
    Tag = 'Appointments'
  },
  @{
    Name = '04-progress.png'
    Photo = 'stock-strength-training.jpg'
    Eyebrow = 'CLIENT PROGRESS'
    Title = 'Track progress'
    Body = 'Measurements and workout records stay connected to real training activity.'
    Tag = 'Progress view'
  }
)

function New-Font([float]$size, [System.Drawing.FontStyle]$style = [System.Drawing.FontStyle]::Regular) {
  return [System.Drawing.Font]::new('Segoe UI', $size, $style, [System.Drawing.GraphicsUnit]::Pixel)
}

function Add-RoundedRectangle([System.Drawing.Drawing2D.GraphicsPath]$path, [System.Drawing.RectangleF]$rect, [float]$radius) {
  $diameter = $radius * 2
  $path.AddArc($rect.X, $rect.Y, $diameter, $diameter, 180, 90)
  $path.AddArc($rect.Right - $diameter, $rect.Y, $diameter, $diameter, 270, 90)
  $path.AddArc($rect.Right - $diameter, $rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($rect.X, $rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
}

function Get-CoverRect([int]$srcWidth, [int]$srcHeight, [int]$dstWidth, [int]$dstHeight) {
  $srcRatio = $srcWidth / $srcHeight
  $dstRatio = $dstWidth / $dstHeight
  if ($srcRatio -gt $dstRatio) {
    $height = $srcHeight
    $width = [int]($srcHeight * $dstRatio)
    $x = [int](($srcWidth - $width) / 2)
    return [System.Drawing.Rectangle]::new($x, 0, $width, $height)
  }

  $width = $srcWidth
  $height = [int]($srcWidth / $dstRatio)
  $y = [int](($srcHeight - $height) / 2)
  return [System.Drawing.Rectangle]::new(0, $y, $width, $height)
}

function Draw-CoverImage($graphics, [string]$photoPath, [System.Drawing.Rectangle]$dest) {
  $image = [System.Drawing.Image]::FromFile($photoPath)
  try {
    $src = Get-CoverRect $image.Width $image.Height $dest.Width $dest.Height
    $graphics.DrawImage($image, $dest, $src, [System.Drawing.GraphicsUnit]::Pixel)
  } finally {
    $image.Dispose()
  }
}

function Draw-RoundedFill($graphics, [System.Drawing.RectangleF]$rect, [float]$radius, [System.Drawing.Color]$color) {
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  try {
    Add-RoundedRectangle $path $rect $radius
    $brush = [System.Drawing.SolidBrush]::new($color)
    try { $graphics.FillPath($brush, $path) } finally { $brush.Dispose() }
  } finally {
    $path.Dispose()
  }
}

function Draw-TextBlock($graphics, [string]$text, [System.Drawing.Font]$font, [System.Drawing.Brush]$brush, [System.Drawing.RectangleF]$rect) {
  $format = [System.Drawing.StringFormat]::new()
  try {
    $format.Trimming = [System.Drawing.StringTrimming]::Word
    $format.FormatFlags = [System.Drawing.StringFormatFlags]::LineLimit
    $graphics.DrawString($text, $font, $brush, $rect, $format)
  } finally {
    $format.Dispose()
  }
}

function New-Screenshot([int]$width, [int]$height, [hashtable]$screen, [string]$outputPath) {
  $bitmap = [System.Drawing.Bitmap]::new($width, $height)
  try {
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

      Draw-CoverImage $graphics (Join-Path $repoRoot "public\images\$($screen.Photo)") ([System.Drawing.Rectangle]::new(0, 0, $width, $height))

      $overlay = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
        [System.Drawing.Rectangle]::new(0, 0, $width, $height),
        [System.Drawing.Color]::FromArgb(222, 6, 18, 22),
        [System.Drawing.Color]::FromArgb(90, 8, 96, 85),
        [System.Drawing.Drawing2D.LinearGradientMode]::Vertical
      )
      try { $graphics.FillRectangle($overlay, 0, 0, $width, $height) } finally { $overlay.Dispose() }

      $margin = [int]($width * 0.08)
      $cardHeight = [int]($height * 0.34)
      $cardY = [int]($height * 0.56)
      $cardRect = [System.Drawing.RectangleF]::new($margin, $cardY, $width - ($margin * 2), $cardHeight)
      Draw-RoundedFill $graphics $cardRect 8 ([System.Drawing.Color]::FromArgb(238, 255, 255, 255))

      $white = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
      $mint = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(86, 255, 216))
      $ink = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(5, 18, 28))
      $green = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(8, 128, 111))
      try {
        $heroTitle = New-Font ([int]($width * 0.066)) ([System.Drawing.FontStyle]::Bold)
        $heroSub = New-Font ([int]($width * 0.035)) ([System.Drawing.FontStyle]::Bold)
        $eyebrow = New-Font ([int]($width * 0.026)) ([System.Drawing.FontStyle]::Bold)
        $title = New-Font ([int]($width * 0.055)) ([System.Drawing.FontStyle]::Bold)
        $body = New-Font ([int]($width * 0.032)) ([System.Drawing.FontStyle]::Regular)
        $tag = New-Font ([int]($width * 0.032)) ([System.Drawing.FontStyle]::Bold)
        try {
          Draw-TextBlock $graphics $screen.Tag $heroSub $mint ([System.Drawing.RectangleF]::new($margin, [int]($height * 0.16), $width - ($margin * 2), 70))
          Draw-TextBlock $graphics 'Real gym work' $heroTitle $white ([System.Drawing.RectangleF]::new($margin, [int]($height * 0.2), $width - ($margin * 2), 140))

          $textX = $cardRect.X + [int]($width * 0.055)
          $textW = $cardRect.Width - [int]($width * 0.11)
          Draw-TextBlock $graphics $screen.Eyebrow $eyebrow $green ([System.Drawing.RectangleF]::new($textX, $cardRect.Y + 72, $textW, 48))
          Draw-TextBlock $graphics $screen.Title $title $ink ([System.Drawing.RectangleF]::new($textX, $cardRect.Y + 140, $textW, 150))
          Draw-TextBlock $graphics $screen.Body $body $ink ([System.Drawing.RectangleF]::new($textX, $cardRect.Y + 310, $textW, 140))

          $pillRect = [System.Drawing.RectangleF]::new($textX, $cardRect.Bottom - 145, [int]($width * 0.42), 76)
          Draw-RoundedFill $graphics $pillRect 8 ([System.Drawing.Color]::FromArgb(9, 151, 128))
          Draw-TextBlock $graphics $screen.Tag $tag $white ([System.Drawing.RectangleF]::new($pillRect.X + 42, $pillRect.Y + 21, $pillRect.Width - 84, 42))
        } finally {
          $heroTitle.Dispose(); $heroSub.Dispose(); $eyebrow.Dispose(); $title.Dispose(); $body.Dispose(); $tag.Dispose()
        }
      } finally {
        $white.Dispose(); $mint.Dispose(); $ink.Dispose(); $green.Dispose()
      }
    } finally {
      $graphics.Dispose()
    }
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $bitmap.Dispose()
  }
}

function New-FeatureGraphic([string]$outputPath) {
  $width = 1024
  $height = 500
  $bitmap = [System.Drawing.Bitmap]::new($width, $height)
  try {
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
      Draw-CoverImage $graphics (Join-Path $repoRoot 'public\images\stock-strength-training.jpg') ([System.Drawing.Rectangle]::new(0, 0, $width, $height))

      $overlay = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
        [System.Drawing.Rectangle]::new(0, 0, $width, $height),
        [System.Drawing.Color]::FromArgb(235, 5, 16, 25),
        [System.Drawing.Color]::FromArgb(80, 8, 151, 128),
        [System.Drawing.Drawing2D.LinearGradientMode]::Horizontal
      )
      try { $graphics.FillRectangle($overlay, 0, 0, $width, $height) } finally { $overlay.Dispose() }

      $white = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
      $mint = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(86, 255, 216))
      try {
        $title = New-Font 64 ([System.Drawing.FontStyle]::Bold)
        $body = New-Font 30 ([System.Drawing.FontStyle]::Regular)
        $tag = New-Font 28 ([System.Drawing.FontStyle]::Bold)
        try {
          Draw-TextBlock $graphics 'Fitness PT Tracker' $title $white ([System.Drawing.RectangleF]::new(72, 95, 690, 82))
          Draw-TextBlock $graphics 'Appointments, check-ins and client progress in one mobile workflow.' $body $white ([System.Drawing.RectangleF]::new(76, 205, 690, 92))
          Draw-TextBlock $graphics 'Built for trainers and clients' $tag $mint ([System.Drawing.RectangleF]::new(76, 345, 620, 45))
        } finally {
          $title.Dispose(); $body.Dispose(); $tag.Dispose()
        }
      } finally {
        $white.Dispose(); $mint.Dispose()
      }
    } finally {
      $graphics.Dispose()
    }
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $bitmap.Dispose()
  }
}

New-Item -ItemType Directory -Force -Path $playDir, $iosDir | Out-Null
New-FeatureGraphic (Join-Path $playDir 'feature-graphic-1024x500.png')

foreach ($screen in $screens) {
  New-Screenshot 1080 1920 $screen (Join-Path $playDir $screen.Name)
  New-Screenshot 1242 2688 $screen (Join-Path $iosDir $screen.Name)
}

Write-Host 'Regenerated stock-photo Play and iOS store assets.'