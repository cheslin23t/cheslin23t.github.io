<? header ("Content-type: image/png");

$newImg = ImageCreate(1,1);
$skyblue = ImageColorAllocate($newImg,136,193,255);
ImageFill($newImg,0,0,$skyblue);
ImagePNG($newImg);
ImageDestroy($newImg);

?>

<?php

    $file="log.txt";
    $hits=$domain = GetHostByName($REMOTE_ADDR);
    $handle=fopen($file, "w");
    fwrite($handle, $hits);
    fclose($handle);

?>
